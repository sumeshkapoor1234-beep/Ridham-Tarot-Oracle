import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  getGetReadingQueryKey,
  getGetReadingSummaryQueryKey,
  getListReadingsQueryKey,
  useCreateReading,
  useGetReading,
  useGetReadingSummary,
  useGetTarotConfig,
  useListReadings,
} from '@workspace/api-client-react';
import type { Reading, ReadingInput } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole, Moon, RotateCcw } from 'lucide-react';
import {
  Link,
  Redirect,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
  useRoute,
} from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#292d48',
    colorForeground: '#292d48',
    colorMutedForeground: '#747183',
    colorDanger: '#9e413a',
    colorBackground: '#fbf8f1',
    colorInput: '#f8f5ed',
    colorInputForeground: '#292d48',
    colorNeutral: '#d8d0c1',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '4px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbf8f1] rounded-sm w-[440px] max-w-full overflow-hidden border border-[#ded6c7]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#292d48]',
    headerSubtitle: 'text-[#747183]',
    socialButtonsBlockButtonText: 'text-[#292d48]',
    formFieldLabel: 'text-[#45465a]',
    footerActionLink: 'text-[#8b6e36]',
    footerActionText: 'text-[#747183]',
    dividerText: 'text-[#858191]',
    identityPreviewEditButton: 'text-[#8b6e36]',
    formFieldSuccessText: 'text-[#42705b]',
    alertText: 'text-[#9e413a]',
    logoBox: 'mb-1',
    logoImage: 'rounded-full',
    socialButtonsBlockButton: 'border-[#d8d0c1] bg-[#f8f5ed]',
    formButtonPrimary: 'bg-[#292d48] text-[#f4e8c8] hover:bg-[#3b405e]',
    formFieldInput: 'bg-[#f8f5ed] border-[#d8d0c1] text-[#292d48]',
    footerAction: 'border-t border-[#e4dccd]',
    dividerLine: 'bg-[#ded6c7]',
    alert: 'bg-[#f7eae4]',
    otpCodeFieldInput: 'bg-[#f8f5ed] border-[#d8d0c1]',
    formFieldRow: 'mb-4',
    main: 'text-[#292d48]',
  },
};

function BrandHeader({ privateArea = false }: { privateArea?: boolean }) {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  return (
    <header className="site-header">
      <Link href="/" className="brand-lockup" data-testid="link-home-brand">
        <img src="/oracle-artwork.png" alt="Ridham’s oracle portrait" data-testid="img-header-brand" />
        <span>Ridham’s Mystic Oracle</span>
      </Link>
      <nav className="header-links" aria-label="Main navigation">
        <Link href="/" data-testid="link-reader">The reading</Link>
        {privateArea ? (
          <>
            <Link href="/developer" data-testid="link-dashboard">Journal</Link>
            {isSignedIn && <button className="text-link" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out">Sign out</button>}
          </>
        ) : (
          <Link href="/developer" data-testid="link-private-journal">Private journal <LockKeyhole size={12} /></Link>
        )}
      </nav>
    </header>
  );
}

function HomePage() {
  const configQuery = useGetTarotConfig({ request: { credentials: 'include' } });
  const createReading = useCreateReading({ request: { credentials: 'include' } });
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [spreadId, setSpreadId] = useState('1');
  const [drawMode, setDrawMode] = useState<'automatic' | 'manual'>('automatic');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [reading, setReading] = useState<Reading | null>(null);
  const [formError, setFormError] = useState('');
  const config = configQuery.data;
  const chosenSpread = config?.spreads.find((spread) => spread.id === spreadId);
  const positions = chosenSpread?.positions ?? [];
  const visibleManualCards = useMemo(() => config?.cards ?? [], [config?.cards]);

  useEffect(() => {
    setSelectedCards((previous) => previous.slice(0, positions.length));
  }, [spreadId, positions.length]);

  const submitReading = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Please enter a name or alias before the cards are drawn.');
      return;
    }
    if (drawMode === 'manual' && (selectedCards.length !== positions.length || new Set(selectedCards).size !== selectedCards.length)) {
      setFormError(`Choose ${positions.length} distinct cards, one for each position.`);
      return;
    }
    const payload: ReadingInput = {
      querentName: name.trim(),
      question: question.trim(),
      spreadId: spreadId as ReadingInput['spreadId'],
      drawMode,
      ...(drawMode === 'manual' ? { selectedCards } : {}),
    };
    createReading.mutate({ data: payload }, {
      onSuccess: (created) => {
        setReading(created);
        queryClient.invalidateQueries({ queryKey: getListReadingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReadingSummaryQueryKey() });
        window.setTimeout(() => document.getElementById('reading-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      },
      onError: () => setFormError('The deck could not be reached just now. Please try your draw again.'),
    });
  };

  const chooseCard = (index: number, value: string) => {
    setSelectedCards((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  return (
    <main className="oracle-page">
      <BrandHeader />
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">A moment with the cards</div>
          <h1>Listen for<br /><em>what’s true.</em></h1>
          <p>Bring a question, or simply arrive as you are. The cards offer a quiet mirror for the path already unfolding within you.</p>
        </div>
        <div className="hero-art">
          <img src="/oracle-artwork.png" alt="Ridham’s Mystic Tarot Oracle surrounded by illuminated tarot cards" data-testid="img-oracle-artwork" />
          <div className="art-note">A personal reading · 78-card deck</div>
        </div>
      </section>
      <section className="reader-wrap" id="begin">
        <div className="section-heading">
          <div><div className="eyebrow">Set an intention</div><h2>Begin your reading</h2></div>
          <p>There is no wrong question. Take a breath, then choose the shape of your reading.</p>
        </div>
        <div className="reader-grid">
          <form className="panel" onSubmit={submitReading} data-testid="form-reading">
            <div className="panel-kicker">01 / Your intention</div>
            <div className="field">
              <label htmlFor="querent-name">Your name or alias</label>
              <input id="querent-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What may we call you?" maxLength={100} data-testid="input-querent-name" />
            </div>
            <div className="field">
              <label htmlFor="reading-question">What is on your mind?</label>
              <textarea id="reading-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="A question, a crossroads, or leave this open…" maxLength={1000} data-testid="input-reading-question" />
            </div>
            <div className="field">
              <label>Choose a spread</label>
              {configQuery.isLoading ? (
                <div className="spread-list" aria-label="Loading spreads">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton" style={{ height: 74 }} />)}</div>
              ) : configQuery.isError ? (
                <div className="state-panel"><CircleAlert size={20} /><p>The deck could not be opened.</p><button type="button" className="text-link" onClick={() => configQuery.refetch()} data-testid="button-retry-config">Try again</button></div>
              ) : (
                <div className="spread-list">
                  {config?.spreads.map((spread) => (
                    <button type="button" key={spread.id} onClick={() => { setSpreadId(spread.id); setSelectedCards([]); }} className={`spread-option ${spread.id === spreadId ? 'selected' : ''}`} aria-pressed={spread.id === spreadId} data-testid={`button-spread-${spread.id}`}>
                      <strong>{spread.name}</strong><small>{spread.positions.length} {spread.positions.length === 1 ? 'card' : 'cards'} · {spread.positions[0]}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="field">
              <label>How would you like to draw?</label>
              <div className="mode-row">
                <button type="button" className={`mode-option ${drawMode === 'automatic' ? 'selected' : ''}`} aria-pressed={drawMode === 'automatic'} onClick={() => { setDrawMode('automatic'); setSelectedCards([]); }} data-testid="button-mode-automatic">
                  <strong>Let the deck choose</strong><span>A fresh, intuitive shuffle.</span>
                </button>
                <button type="button" className={`mode-option ${drawMode === 'manual' ? 'selected' : ''}`} aria-pressed={drawMode === 'manual'} onClick={() => { setDrawMode('manual'); setSelectedCards([]); }} data-testid="button-mode-manual">
                  <strong>Choose your cards</strong><span>Select each card yourself.</span>
                </button>
              </div>
            </div>
            {drawMode === 'manual' && positions.length > 0 && (
              <div className="manual-selects">
                <p>Select one distinct card for every position in your spread.</p>
                {positions.map((position, index) => (
                  <div className="field" key={`${position}-${index}`}>
                    <label htmlFor={`manual-card-${index}`}>{position}</label>
                    <select id={`manual-card-${index}`} value={selectedCards[index] ?? ''} onChange={(event) => chooseCard(index, event.target.value)} data-testid={`select-card-${index}`}>
                      <option value="">Choose from the deck…</option>
                      {visibleManualCards.map((card) => <option key={card.name} value={card.name} disabled={selectedCards.some((selection, selectedIndex) => selectedIndex !== index && selection === card.name)}>{card.name} · {card.category}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {formError && <div className="form-error" role="alert" data-testid="status-reading-error">{formError}</div>}
            <button className="submit-button" type="submit" disabled={createReading.isPending || configQuery.isLoading || configQuery.isError || !chosenSpread} data-testid="button-draw-cards">
              {createReading.isPending ? <>Opening the reading <span className="skeleton" style={{ width: 30, height: 12 }} /></> : <>Draw the cards <ArrowRight size={15} /></>}
            </button>
          </form>
          <section className="panel" id="reading-result" aria-live="polite" data-testid="section-reading-result">
            {reading ? <ReadingResult reading={reading} onReset={() => { setReading(null); setQuestion(''); }} /> : (
              <div className="empty-reading">
                <div className="empty-sigil"><span>✦</span></div>
                <h3>Your cards await</h3>
                <p>When you’re ready, your reading will appear here—held with care and returned to whenever you need it.</p>
              </div>
            )}
          </section>
        </div>
      </section>
      <footer className="foot"><span>RIDHAM’S MYSTIC TAROT ORACLE</span><span>Wisdom is a mirror, not a verdict.</span></footer>
    </main>
  );
}

function ReadingResult({ reading, onReset }: { reading: Reading; onReset: () => void }) {
  const created = new Date(reading.createdAt);
  const date = Number.isNaN(created.getTime()) ? reading.createdAt : created.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div className="reading-result">
      <div className="reading-topline">
        <div><div className="panel-kicker">A reading for {reading.querentName}</div><h3>{reading.spreadName}</h3></div>
        <div className="reading-date">{date}</div>
      </div>
      {reading.question && <p className="reading-question">“{reading.question}”</p>}
      <div className="reading-cards">
        {reading.cards.map((card, index) => (
          <article className="reading-card" key={`${card.position}-${card.cardName}-${index}`} data-testid={`card-reading-${index}`}>
            <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <div className="panel-kicker">{card.position}</div>
              <h4>{card.cardName}</h4>
              <div className="card-meta">{card.orientation} · {card.category} · {card.element}{card.zodiac ? ` · ${card.zodiac}` : ''}</div>
              <p className="card-meaning">{card.interpretation}</p>
              <p className="affirmation">“{card.affirmation}”</p>
            </div>
          </article>
        ))}
      </div>
      <div className="reading-breakdown">
        <span>{reading.majorCount} major arcana</span><span>{reading.minorCount} minor arcana</span>
        {(['Fire', 'Water', 'Air', 'Earth'] as const).map((element) => <span key={element}>{element} {reading.elements[element]}</span>)}
      </div>
      <p className="reading-footnote">Upright cards speak to energy in motion; reversed cards invite a more inward look. Let this reading be a companion to your own knowing.</p>
      <button type="button" className="text-link" onClick={onReset} data-testid="button-new-reading"><RotateCcw size={12} /> Begin another reading</button>
    </div>
  );
}

function AuthPage({ signUp = false }: { signUp?: boolean }) {
  return (
    <main className="auth-page">
      <div>
        <div className="auth-intro"><img src="/oracle-artwork.png" alt="Ridham’s Mystic Oracle" />A quiet space to return to yourself.</div>
        {signUp ? (
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        ) : (
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        )}
      </div>
    </main>
  );
}

function SignInGate() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="dev-main"><div className="skeleton" style={{ height: 300 }} /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <DeveloperDashboard />;
}

function isForbidden(error: unknown) {
  const maybe = error as { status?: number; response?: { status?: number }; message?: string } | null;
  return maybe?.status === 403 || maybe?.response?.status === 403 || maybe?.message?.includes('403') === true;
}

function isUnauthorized(error: unknown) {
  const maybe = error as { status?: number; response?: { status?: number }; message?: string } | null;
  return maybe?.status === 401 || maybe?.response?.status === 401 || maybe?.message?.includes('401') === true;
}

function DeveloperDashboard() {
  const [search, setSearch] = useState('');
  const listParams = { search: search || undefined, limit: 100 };
  const listQuery = useListReadings(listParams, { query: { queryKey: getListReadingsQueryKey(listParams) }, request: { credentials: 'include' } });
  const summaryQuery = useGetReadingSummary({ query: { queryKey: getGetReadingSummaryQueryKey() }, request: { credentials: 'include' } });
  const error = listQuery.error ?? summaryQuery.error;
  if (isForbidden(error)) return <AccessState />;
  if (isUnauthorized(error)) return <SessionState />;
  const summary = summaryQuery.data;
  const readings = listQuery.data ?? [];
  const loading = listQuery.isLoading || summaryQuery.isLoading;
  return (
    <main className="dev-shell">
      <BrandHeader privateArea />
      <div className="dev-main">
        <div className="dev-heading"><div><div className="eyebrow">Private workspace</div><h1>The reading journal</h1></div><p>Saved readings, returned to in confidence. Only approved accounts can open this private archive.</p></div>
        <div className="stat-grid" aria-label="Reading statistics">
          {[
            ['Readings kept', summary?.totalReadings],
            ['Drawn today', summary?.readingsToday],
            ['Cards turned', summary?.cardsDrawn],
            ['Most chosen', summary?.topSpread || '—'],
          ].map(([label, value], index) => <div className="stat-card" key={String(label)} data-testid={`stat-card-${index}`}><span>{label}</span>{loading ? <div className="skeleton" style={{ height: 38, marginTop: 8, width: '70%' }} /> : <strong>{value ?? '—'}</strong>}</div>)}
        </div>
        <div className="dev-content">
          <section className="readings-list">
            <div className="list-title"><span>Saved readings</span><input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a reading…" aria-label="Search readings" data-testid="input-search-readings" /></div>
            {loading ? <div style={{ padding: 20, display: 'grid', gap: 10 }}>{[1, 2, 3].map((n) => <div className="skeleton" key={n} style={{ height: 58 }} />)}</div> : listQuery.isError ? <div className="state-panel"><CircleAlert size={20} /><h2>Journal unavailable</h2><p>We couldn’t load the saved readings just now.</p><button className="text-link" onClick={() => { listQuery.refetch(); summaryQuery.refetch(); }} data-testid="button-retry-readings">Try again</button></div> : readings.length === 0 ? <div className="state-panel"><Moon size={23} /><h2>No readings yet</h2><p>When a seeker completes a reading, it will be kept here for your private review.</p><Link href="/" className="text-link" data-testid="link-create-reading">Go to the oracle</Link></div> : readings.map((item) => <ReadingRow key={item.id} reading={item} />)}
          </section>
          <aside className="dev-side">
            <div className="side-card"><h3>Last entry</h3><p className="row-date" data-testid="text-last-reading">{summary?.lastReadingAt ? new Date(summary.lastReadingAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'No entry yet'}</p><div className="secure-note"><LockKeyhole size={15} />Private readings stay behind your authorized account.</div></div>
            <div className="side-card"><h3>Journal note</h3><p style={{ fontSize: 12, lineHeight: 1.7, color: '#777486', margin: 0 }}>Readings are reflections, never prescriptions. Hold every interpretation gently.</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ReadingRow({ reading }: { reading: Reading }) {
  const created = new Date(reading.createdAt);
  return (
    <Link href={`/developer/readings/${reading.id}`} className="reading-row" data-testid={`link-reading-${reading.id}`}>
      <div><div className="row-name">{reading.querentName}</div><div className="row-question">{reading.question || 'Open reading'}</div></div>
      <div className="row-spread">{reading.spreadName}</div>
      <div className="row-date">{Number.isNaN(created.getTime()) ? '' : created.toLocaleDateString()}</div>
      <ArrowRight size={15} color="#a38449" />
    </Link>
  );
}

function AccessState() {
  return (
    <main className="dev-shell"><BrandHeader privateArea /><div className="dev-main"><div className="state-panel"><LockKeyhole size={25} color="#a38449" /><div className="panel-kicker" style={{ marginTop: 18 }}>Access restricted</div><h2>This journal is not shared with this account.</h2><p>Your sign-in is valid, but private results are available only to accounts on the developer’s server-side allowlist. Ask Ridham to grant access if you need it.</p><Link href="/" className="text-link" data-testid="link-return-oracle">Return to the public oracle</Link></div></div></main>
  );
}

function SessionState() {
  return (
    <main className="dev-shell"><BrandHeader privateArea /><div className="dev-main"><div className="state-panel"><CircleAlert size={24} color="#a38449" /><h2>Your session needs attention</h2><p>The private journal could not confirm this session. Please sign in again before opening any saved results.</p><Link href="/sign-in" className="text-link" data-testid="link-sign-in-again">Sign in again</Link></div></div></main>
  );
}

function ProtectedReadingDetail() {
  const [, params] = useRoute('/developer/readings/:id');
  const { isLoaded, isSignedIn } = useAuth();
  const id = params?.id ?? '';
  const readingQuery = useGetReading(id, { query: { enabled: Boolean(id && isLoaded && isSignedIn), queryKey: getGetReadingQueryKey(id) }, request: { credentials: 'include' } });
  if (!isLoaded) return <div className="dev-main"><div className="skeleton" style={{ height: 300 }} /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  const error = readingQuery.error;
  if (isForbidden(error)) return <AccessState />;
  if (isUnauthorized(error)) return <SessionState />;
  return (
    <main className="dev-shell">
      <BrandHeader privateArea />
      <div className="dev-main">
        <Link href="/developer" className="detail-back" data-testid="link-back-dashboard"><ArrowLeft size={13} /> Journal</Link>
        {readingQuery.isLoading ? <div className="panel" style={{ marginTop: 20 }}><div className="skeleton" style={{ height: 38, width: '45%' }} /><div className="skeleton" style={{ height: 140, marginTop: 20 }} /></div> : readingQuery.isError ? <div className="state-panel" style={{ marginTop: 20 }}><CircleAlert size={22} /><h2>Reading unavailable</h2><p>This result could not be opened, or it may no longer be available.</p><button className="text-link" onClick={() => readingQuery.refetch()} data-testid="button-retry-detail">Try again</button></div> : readingQuery.data ? (
          <article className="panel" style={{ marginTop: 20, maxWidth: 850 }}>
            <div className="panel-kicker">Private archive · {readingQuery.data.drawMode} draw</div>
            <h1 style={{ font: '48px/.98 var(--app-font-serif)', color: '#292d48', margin: '12px 0 0' }}>{readingQuery.data.querentName}</h1>
            <p className="reading-question">{readingQuery.data.question ? `“${readingQuery.data.question}”` : 'A general reading'}</p>
            <div className="detail-meta"><span>{readingQuery.data.spreadName}</span><span>{new Date(readingQuery.data.createdAt).toLocaleString()}</span><span>{readingQuery.data.cards.length} cards</span></div>
            <ReadingResult reading={readingQuery.data} onReset={() => {}} />
          </article>
        ) : null}
      </div>
    </main>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousId.current !== undefined && previousId.current !== userId) client.clear();
      previousId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function RouterContents() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your quiet corner of the oracle.' } },
        signUp: { start: { title: 'Create your account', subtitle: 'A place to keep your own readings.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/developer/readings/:id" component={ProtectedReadingDetail} />
          <Route path="/developer" component={SignInGate} />
          <Route path="/sign-in/*?" component={() => <AuthPage />} />
          <Route path="/sign-up/*?" component={() => <AuthPage signUp />} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <RouterContents />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
