import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import Avatar from '../components/Avatar.jsx';

// Amis : même identité que Mes films. Chaque bloc est une section éditoriale (titre en Fraunces, filet dessous).
export default function Friends() {
  const { t } = useI18n();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([client.get('/friends'), client.get('/friends/requests'), client.get('/friends/sent')])
      .then(([f, r, s]) => {
        setFriends(f.data);
        setRequests(r.data);
        setSent(s.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const { data } = await client.get('/friends/search', { params: { q: query } });
    setResults(data);
  };

  const sendRequest = async (username) => {
    setMessage('');
    try {
      await client.post('/friends/request', { username });
      setMessage(t('friends.sentTo', { username }));
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || t('friends.sendError'));
    }
  };

  const accept = async (friendshipId) => {
    await client.post(`/friends/${friendshipId}/accept`);
    load();
  };

  const remove = async (friendshipId) => {
    await client.delete(`/friends/${friendshipId}`);
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('friends.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('friends.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('friends.subtitle')}</p>
        </header>

        <section className="animate-rise mt-14" style={{ animationDelay: '100ms' }}>
          <SectionTitle title={t('friends.addTitle')} />
          <form onSubmit={search} className="flex items-center gap-4 border-b border-ink-line transition-colors focus-within:border-signal">
            <label htmlFor="friend-search" className="sr-only">
              {t('friends.searchPlaceholder')}
            </label>
            <input
              id="friend-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('friends.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
            />
            <button type="submit" className="shrink-0 text-sm text-signal underline-offset-4 hover:underline">
              {t('friends.submit')} →
            </button>
          </form>

          {message && (
            <p role="status" className="mt-4 text-sm text-ink-muted">
              {message}
            </p>
          )}

          {results.length > 0 && (
            <ul className="mt-6 divide-y divide-ink-line">
              {results.map((u) => (
                <Row
                  key={u.id}
                  user={u}
                  action={
                    <button
                      type="button"
                      onClick={() => sendRequest(u.username)}
                      className="text-sm text-signal underline-offset-4 hover:underline"
                    >
                      {t('friends.add')}
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </section>

        {requests.length > 0 && (
          <section className="animate-rise mt-14" style={{ animationDelay: '160ms' }}>
            <SectionTitle title={t('friends.received')} />
            <ul className="divide-y divide-ink-line">
              {requests.map((u) => (
                <Row
                  key={u.friendship_id}
                  user={u}
                  action={
                    <div className="flex items-center gap-5 text-sm">
                      <button
                        type="button"
                        onClick={() => accept(u.friendship_id)}
                        className="text-signal underline-offset-4 hover:underline"
                      >
                        {t('friends.accept')}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(u.friendship_id)}
                        className="text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
                      >
                        {t('friends.decline')}
                      </button>
                    </div>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {sent.length > 0 && (
          <section className="animate-rise mt-14" style={{ animationDelay: '220ms' }}>
            <SectionTitle title={t('friends.sent')} />
            <ul className="divide-y divide-ink-line">
              {sent.map((u) => (
                <Row key={u.friendship_id} user={u} action={<span className="text-sm text-ink-muted">{t('friends.pending')}</span>} />
              ))}
            </ul>
          </section>
        )}

        <section className="animate-rise mt-14" style={{ animationDelay: '280ms' }}>
          <SectionTitle title={`${t('friends.mine')} (${friends.length})`} />
          {friends.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">{t('friends.none')}</p>
          ) : (
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {friends.map((f) => (
                <li key={f.id} className="border-b border-ink-line py-4">
                  <Row user={f} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return <h2 className="mb-6 border-b border-ink-line pb-3 font-display text-2xl font-medium">{title}</h2>;
}

function Row({ user, action }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <Avatar user={user} size="w-10 h-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg text-paper">{user.display_name}</p>
        <p className="truncate text-xs text-ink-muted">@{user.username}</p>
      </div>
      {action}
    </div>
  );
}
