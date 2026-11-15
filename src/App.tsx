
import { useEffect, useMemo, useState, type FormEvent, type ElementType } from 'react';
import {
  Home, Search, Flame, Bell, Mail, User, Settings,
  PlusSquare, Heart, MessageCircle, Bookmark, Send,
  Camera, X, Compass, CheckCircle2, Video,
  Shield, QrCode, Link2, Smile, Phone, Play,
  Eye, ChevronRight, Sparkles, UserPlus
} from 'lucide-react';
import './App.css';
import Auth from './Auth';
import { supabase } from './lib/supabase';

type Tab =
  | 'home'
  | 'search'
  | 'explore'
  | 'notifications'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'create'
  | 'saved';

type Post = {
  id: number;
  author: string;
  username: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: string[];
};

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
};

const initialPosts: Post[] = [
  {
    id: 1,
    author: 'DV Official',
    username: '@dv_official',
    avatar: 'DV',
    time: '5 мин.',
    content: 'Добро пожаловать в DV SOCIAL! 🔵\n\nТвоё пространство для общения, творчества и новых знакомств.',
    likes: 42,
    liked: false,
    saved: false,
    comments: ['Отличное начало!']
  },
  {
    id: 2,
    author: 'Алексей Дизайнер',
    username: '@alex_ui',
    avatar: 'АД',
    time: '1 час',
    content: 'Создаём новое цифровое пространство. Как вам наш новый стиль?',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1100&q=80',
    likes: 128,
    liked: false,
    saved: false,
    comments: []
  }
];

const navigation = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'search', label: 'Поиск', icon: Search },
  { id: 'explore', label: 'Рекомендации', icon: Flame },
  { id: 'messages', label: 'Сообщения', icon: Mail },
  { id: 'settings', label: 'Настройки', icon: Settings }
] as const;

const users = [
  { name: 'Мария Код', username: '@maria_dev', avatar: 'МК' },
  { name: 'Техно Блог', username: '@tech_news', avatar: 'ТБ' },
  { name: 'Алексей Дизайнер', username: '@alex_ui', avatar: 'АД' },
  { name: 'DV Official', username: '@dv_official', avatar: 'DV' }
];

const chats = [
  { id: 'maria', name: 'Мария Код', username: '@maria_dev', avatar: 'МК', preview: 'Привет! Как дела?', time: '10:42', unread: 2 },
  { id: 'alex', name: 'Алексей Дизайнер', username: '@alex_ui', avatar: 'АД', preview: 'Отправил тебе дизайн', time: 'Вчера', unread: 0 },
  { id: 'tech', name: 'Техно Блог', username: '@tech_news', avatar: 'ТБ', preview: '🔥 Новые новости', time: 'Пн', unread: 0 }
];

const stickers = ['👋', '🔥', '❤️', '😂', '🚀', '😍', '👍', '✨', '🎉', '🤝', '💜', '😎'];

function loadPosts(): Post[] {
  try {
    const saved = localStorage.getItem('dv-social-posts');
    if (!saved) return initialPosts;

    const parsed = JSON.parse(saved) as Post[];

    return parsed.map(post => ({
      ...post,
      comments: Array.isArray(post.comments) ? post.comments : []
    }));
  } catch {
    return initialPosts;
  }
}

function App() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!session?.user.id) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      setProfileError('');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setProfileError(error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [posts, setPosts] = useState<Post[]>(loadPosts);

  const [following, setFollowing] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dv-social-following') || '[]');
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, string[]>>({});
  const [activeChat, setActiveChat] = useState('maria');
  const [stickerPicker, setStickerPicker] = useState(false);
  const [settingsSection, setSettingsSection] = useState('main');
  const [connected, setConnected] = useState<string[]>([]);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordMessage('Пароль успешно изменён!');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Не удалось изменить пароль. Попробуй ещё раз.');
    } finally {
      setPasswordLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem('dv-social-posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('dv-social-following', JSON.stringify(following));
  }, [following]);

  const title = navigation.find(item => item.id === activeTab)?.label
    ?? (activeTab === 'notifications'
      ? 'Уведомления'
      : activeTab === 'profile'
        ? 'Мой профиль'
        : activeTab === 'create'
          ? 'Создать публикацию'
          : 'Сохранённое');

  const visiblePosts = useMemo(() => {
    if (activeTab === 'saved') {
      return posts.filter(post => post.saved);
    }

    if (activeTab === 'explore') {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }

    if (activeTab === 'search') {
      const query = search.toLowerCase().trim();

      if (!query) return [];

      return posts.filter(post =>
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.username.toLowerCase().includes(query)
      );
    }

    return posts;
  }, [posts, activeTab, search]);

  const filteredUsers = users.filter(user =>
    !search ||
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const currentChat = chats.find(chat => chat.id === activeChat) ?? chats[0];
  const currentMessages = chatMessages[activeChat] ?? [];

  function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!postText.trim() && !selectedImage) return;

    const newPost: Post = {
      id: Date.now(),
      author: profile?.display_name || 'Пользователь',
      username: `@${profile?.username || 'username'}`,
      avatar: profile?.display_name?.slice(0, 2).toUpperCase() || 'DV',
      time: 'Только что',
      content: postText.trim(),
      image: selectedImage || undefined,
      likes: 0,
      liked: false,
      saved: false,
      comments: []
    };

    setPosts(previous => [newPost, ...previous]);
    setPostText('');
    setSelectedImage('');
    setActiveTab('home');
  }

  function toggleLike(id: number) {
    setPosts(previous => previous.map(post =>
      post.id === id
        ? {
            ...post,
            liked: !post.liked,
            likes: post.likes + (post.liked ? -1 : 1)
          }
        : post
    ));
  }

  function toggleSave(id: number) {
    setPosts(previous => previous.map(post =>
      post.id === id ? { ...post, saved: !post.saved } : post
    ));
  }

  function toggleFollow(username: string) {
    setFollowing(previous =>
      previous.includes(username)
        ? previous.filter(item => item !== username)
        : [...previous, username]
    );
  }

  function addComment(id: number) {
    const text = commentDrafts[id]?.trim();

    if (!text) return;

    setPosts(previous => previous.map(post =>
      post.id === id
        ? { ...post, comments: [...post.comments, text] }
        : post
    ));

    setCommentDrafts(previous => ({
      ...previous,
      [id]: ''
    }));
  }

  function selectPhoto(file?: File) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Выбери файл изображения.');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Пока поддерживаются фотографии до 1,5 МБ.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) return;

    setChatMessages(previous => ({
      ...previous,
      [activeChat]: [
        ...(previous[activeChat] ?? []),
        message.trim()
      ]
    }));

    setMessage('');
  }

  function sendSticker(sticker: string) {
    setChatMessages(previous => ({
      ...previous,
      [activeChat]: [
        ...(previous[activeChat] ?? []),
        sticker
      ]
    }));

    setStickerPicker(false);
  }

  function renderPost(post: Post) {
    return (
      <article className="post-card" key={post.id}>
        <div className="post-header">
          <div className="avatar">{post.avatar}</div>

          <div className="post-author">
            <div className="author-name">
              {post.author}
              <CheckCircle2 size={15} className="verified" />
            </div>

            <span>{post.username} · {post.time}</span>
          </div>
        </div>

        {post.content && (
          <p className="post-text">{post.content}</p>
        )}

        {post.image && (
          <img
            className="post-image"
            src={post.image}
            alt="Фото публикации"
          />
        )}

        <div className="post-actions">
          <button
            className={post.liked ? 'action active-like' : 'action'}
            onClick={() => toggleLike(post.id)}
          >
            <Heart
              size={19}
              fill={post.liked ? 'currentColor' : 'none'}
            />
            {post.likes}
          </button>

          <span className="action">
            <MessageCircle size={19} />
            {post.comments.length}
          </span>

          <button
            className="action"
            onClick={() => toggleSave(post.id)}
          >
            <Bookmark
              size={19}
              fill={post.saved ? 'currentColor' : 'none'}
            />
            {post.saved ? 'Сохранено' : ''}
          </button>

          <button
            className="action"
            onClick={() => navigator.clipboard?.writeText(post.content)}
            aria-label="Скопировать публикацию"
          >
            <Send size={18} />
          </button>
        </div>

        {post.comments.map((comment, index) => (
          <div className="comment" key={`${post.id}-${index}`}>
            <b>Пользователь</b> {comment}
          </div>
        ))}

        <form
          className="comment-form"
          onSubmit={event => {
            event.preventDefault();
            addComment(post.id);
          }}
        >
          <input
            placeholder="Написать комментарий..."
            value={commentDrafts[post.id] || ''}
            onChange={event =>
              setCommentDrafts(previous => ({
                ...previous,
                [post.id]: event.target.value
              }))
            }
          />

          <button
            type="submit"
            disabled={!commentDrafts[post.id]?.trim()}
          >
            Ответить
          </button>
        </form>
      </article>
    );
  }

  function settingsRow(
    icon: ElementType,
    heading: string,
    description: string,
    section: string
  ) {
    const Icon = icon;

    return (
      <button
        className="settings-menu-row"
        onClick={() => setSettingsSection(section)}
      >
        <span className="settings-menu-icon">
          <Icon size={20} />
        </span>

        <span className="settings-menu-copy">
          <b>{heading}</b>
          <small>{description}</small>
        </span>

        <ChevronRight size={18} />
      </button>
    );
  }

  function renderSettings() {
    const backButton = (
      <button
        className="settings-back"
        onClick={() => setSettingsSection('main')}
      >
        ← Все настройки
      </button>
    );

    if (settingsSection === 'main') {
      return (
        <section className="page-content settings-page">
          <div className="settings-intro">
            <div className="avatar">
              {profile?.display_name?.slice(0, 2).toUpperCase() || 'DV'}
            </div>

            <div>
              <h2>Настройки DV SOCIAL</h2>
              <p>Управляй своим аккаунтом и приложением</p>
            </div>
          </div>

          {settingsRow(User, 'Мой аккаунт', 'Имя, имя пользователя и личные данные', 'account')}
          {settingsRow(Link2, 'Подключённые аккаунты', 'Telegram, VK и другие сервисы', 'connections')}
          {settingsRow(Shield, 'Безопасность', 'Защита аккаунта и способы входа', 'security')}
          {settingsRow(QrCode, 'QR-код и контакты', 'Находи друзей и делись своим профилем', 'qr')}
          {settingsRow(Eye, 'Приватность', 'Кто может видеть твой профиль', 'privacy')}
          {settingsRow(Bell, 'Уведомления', 'Настрой оповещения приложения', 'notifications')}
          {settingsRow(Compass, 'О приложении', 'DV SOCIAL · Первая версия', 'about')}
        </section>
      );
    }

    if (settingsSection === 'connections') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>Подключённые аккаунты</h2>
          <p className="muted">
            Свяжи другие сервисы со своим профилем DV SOCIAL.
          </p>

          {['Telegram', 'ВКонтакте'].map(service => (
            <div className="connection-card" key={service}>
              <div className="connection-logo">
                {service === 'Telegram' ? '✈' : 'VK'}
              </div>

              <div className="settings-menu-copy">
                <b>{service}</b>
                <small>
                  {connected.includes(service)
                    ? 'Подключение демонстрационное'
                    : 'Аккаунт пока не подключён'}
                </small>
              </div>

              <button
                className="small-button"
                onClick={() =>
                  setConnected(previous =>
                    previous.includes(service)
                      ? previous.filter(item => item !== service)
                      : [...previous, service]
                  )
                }
              >
                {connected.includes(service) ? 'Отключить' : 'Подключить'}
              </button>
            </div>
          ))}

          <p className="settings-notice">
            Пока это макет интерфейса. Настоящий вход через Telegram и VK
            подключим через официальные механизмы авторизации.
          </p>
        </section>
      );
    }

    if (settingsSection === 'security') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>Безопасность</h2>

          <div className="settings-info-card">
            <Shield size={24} />

            <div>
              <b>Защита аккаунта</b>
              <p>Управляй безопасностью своего аккаунта DV SOCIAL.</p>
            </div>
          </div>

          <form
            className="settings-password-form"
            onSubmit={changePassword}
          >
            <h3>Изменение пароля</h3>

            <label htmlFor="new-password">Новый пароль</label>
            <input
              id="new-password"
              type="password"
              placeholder="Минимум 8 символов"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirm-password">Повтори новый пароль</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Повтори пароль"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            {passwordError && (
              <p className="password-error">{passwordError}</p>
            )}

            {passwordMessage && (
              <p className="password-success">{passwordMessage}</p>
            )}

            <button
              type="submit"
              className="password-save-button"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Сохраняем...' : 'Изменить пароль'}
            </button>
          </form>

          <div className="settings-menu-row">
            <Phone size={20} />

            <span className="settings-menu-copy">
              <b>Номер телефона</b>
              <small>Подтверждение номера появится позже</small>
            </span>
          </div>

          <div className="settings-menu-row">
            <Eye size={20} />

            <span className="settings-menu-copy">
              <b>Активные устройства</b>
              <small>Управление устройствами появится позже</small>
            </span>
          </div>

          <p className="settings-notice">
            Не вводи здесь пароли от Telegram или VK.
          </p>
        </section>
      );
    }

    if (settingsSection === 'qr') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>QR-код и контакты</h2>

          <div className="qr-demo">
            <QrCode size={100} />
            <b>Твой профиль DV</b>
            <span>@{profile?.username || 'username'}</span>
          </div>

          <p className="muted">
            В будущем QR-код позволит быстро открыть профиль и добавить человека.
          </p>

          <button
            className="primary-button"
            onClick={() => alert('Сканирование QR-кодов подключим на следующем этапе.')}
          >
            <QrCode size={18} /> Сканировать QR-код
          </button>

          <div className="settings-info-card">
            <Phone size={22} />

            <div>
              <b>Поиск по номеру</b>
              <p>
                Добавление контактов по номеру телефона появится после
                подключения аккаунтов и разрешений.
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (settingsSection === 'privacy') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>Приватность</h2>

          <div className="settings-toggle-row">
            <div>
              <b>Закрытый аккаунт</b>
              <small>
                Только одобренные подписчики смогут видеть публикации
              </small>
            </div>

            <input
              type="checkbox"
              checked={privateAccount}
              onChange={event => setPrivateAccount(event.target.checked)}
            />
          </div>

          <p className="settings-notice">
            Переключатель пока меняет только состояние интерфейса.
            Серверные правила приватности добавим позже.
          </p>
        </section>
      );
    }

    if (settingsSection === 'notifications') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>Уведомления</h2>

          <div className="settings-toggle-row">
            <div>
              <b>Уведомления приложения</b>
              <small>Показывать оповещения в интерфейсе</small>
            </div>

            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={event => setNotificationsEnabled(event.target.checked)}
            />
          </div>
        </section>
      );
    }

    if (settingsSection === 'account') {
      return (
        <section className="page-content settings-page">
          {backButton}

          <h2>Мой аккаунт</h2>

          <div className="settings-info-card">
            <User size={24} />

            <div>
              <b>{session?.user.email ?? 'Аккаунт DV'}</b>
              <p>Твой аккаунт DV SOCIAL</p>
            </div>
          </div>

          <p className="settings-notice">
            Изменение имени и фотографии профиля добавим отдельно.
          </p>
        </section>
      );
    }

    return (
      <section className="page-content settings-page">
        {backButton}

        <h2>О DV SOCIAL</h2>
        <p className="muted">Твоя сеть. Твоё пространство.</p>

        <div className="settings-info-card">
          <Sparkles size={24} />

          <div>
            <b>DV SOCIAL</b>
            <p>
              Первая версия приложения. Мы постепенно добавляем новые возможности.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (authLoading) {
    return <div className="auth-screen">Загрузка DV SOCIAL...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setActiveTab('home')}
        >
          <span className="brand-icon">DV</span>
          <span>DV SOCIAL</span>
        </button>

        <nav className="navigation">
          {navigation.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={
                  activeTab === item.id
                    ? 'nav-item selected'
                    : 'nav-item'
                }
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            className="create-button"
            onClick={() => setActiveTab('create')}
          >
            <PlusSquare size={20} />
            <span>Создать публикацию</span>
          </button>

          <button
            className="nav-item"
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={21} />
            <span>Сохранённое</span>
          </button>
        </nav>

        <button
          className="account-button"
          onClick={() => setActiveTab('profile')}
        >
          <div className="avatar">
            {profile?.display_name?.slice(0, 2).toUpperCase() || 'DV'}
          </div>

          <div>
            <b>{profile?.display_name || 'Пользователь'}</b>
            <span>@{profile?.username || 'username'}</span>
          </div>
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <h1>
            {activeTab === 'settings' ? 'Настройки' : title}
          </h1>

          <button
            className="icon-button"
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={21} />
          </button>
        </header>

        {activeTab === 'home' && (
          <>
            <form className="quick-create" onSubmit={createPost}>
              <div className="avatar">
                {profile?.display_name?.slice(0, 2).toUpperCase() || 'DV'}
              </div>

              <input
                value={postText}
                onChange={event => setPostText(event.target.value)}
                placeholder="Что нового?"
              />

              <button type="submit" disabled={!postText.trim()}>
                Опубликовать
              </button>
            </form>

            <div className="feed-heading">
              <h2>Ваша лента</h2>
              <span>Последние публикации</span>
            </div>

            {visiblePosts.map(renderPost)}
          </>
        )}

        {activeTab === 'search' && (
          <section className="page-content">
            <div className="search-box">
              <Search size={20} />

              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Искать людей и публикации..."
                autoFocus
              />
            </div>

            <h2>Люди</h2>

            {filteredUsers.map(user => (
              <div className="user-row" key={user.username}>
                <div className="avatar">{user.avatar}</div>

                <div className="user-info">
                  <b>{user.name}</b>
                  <span>{user.username}</span>
                </div>

                <button
                  className="small-button"
                  onClick={() => toggleFollow(user.username)}
                >
                  {following.includes(user.username)
                    ? 'Вы подписаны'
                    : 'Подписаться'}
                </button>
              </div>
            ))}

            <h2>Публикации</h2>

            {visiblePosts.map(renderPost)}

            {!search.trim() && (
              <p className="muted">
                Введи имя пользователя или слово из публикации.
              </p>
            )}

            {search.trim() &&
              filteredUsers.length === 0 &&
              visiblePosts.length === 0 && (
                <p className="muted">
                  Ничего не найдено. Попробуй другой запрос.
                </p>
              )}
          </section>
        )}

        {activeTab === 'explore' && (
          <section className="page-content explore-page">
            <div className="explore-heading">
              <div>
                <h2>
                  <Flame className="inline-icon" /> Рекомендации
                </h2>
                <p className="muted">
                  Открывай новые публикации и авторов
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() => setActiveTab('create')}
              >
                <Video />
              </button>
            </div>

            <div className="shorts-placeholder">
              <div className="shorts-play">
                <Play size={30} fill="currentColor" />
              </div>

              <b>DV SHORTS</b>
              <span>Короткие видео появятся здесь</span>

              <button
                className="small-button"
                onClick={() => setActiveTab('create')}
              >
                Создать публикацию
              </button>
            </div>

            <h2>Популярные публикации</h2>

            {visiblePosts.map(renderPost)}

            <div className="explore-bottom-nav">
              <button onClick={() => setActiveTab('home')}>
                <Home />
                <span>Лента</span>
              </button>

              <button
                className="active"
                onClick={() => setActiveTab('explore')}
              >
                <Flame />
                <span>Рекомендации</span>
              </button>

              <button onClick={() => setActiveTab('create')}>
                <PlusSquare />
                <span>Создать</span>
              </button>

              <button onClick={() => setActiveTab('messages')}>
                <Mail />
                <span>Чаты</span>
              </button>

              <button onClick={() => setActiveTab('profile')}>
                <User />
                <span>Профиль</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === 'create' && (
          <section className="page-content">
            <h2>Создать публикацию</h2>

            <form className="create-form" onSubmit={createPost}>
              <textarea
                value={postText}
                onChange={event => setPostText(event.target.value)}
                placeholder="Расскажи, что у тебя нового..."
                rows={6}
              />

              <label className="upload-area">
                <Camera size={28} />
                <b>Добавить фотографию</b>
                <span>Изображение до 1,5 МБ</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={event => selectPhoto(event.target.files?.[0])}
                />
              </label>

              {selectedImage && (
                <div className="image-preview">
                  <img src={selectedImage} alt="Предпросмотр" />

                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => setSelectedImage('')}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={!postText.trim() && !selectedImage}
              >
                Опубликовать
              </button>
            </form>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="empty-state">
            <Bell size={42} />
            <h2>Уведомления</h2>
            <p>
              Здесь будут появляться лайки, комментарии и новые подписчики.
            </p>
            <span className="muted">Пока уведомлений нет.</span>
          </section>
        )}

        {activeTab === 'messages' && (
          <section className="messages-layout">
            <div className="chat-list">
              <div className="chat-list-heading">
                <h2>Сообщения</h2>

                <button className="icon-button" title="Новый чат">
                  <UserPlus size={19} />
                </button>
              </div>

              <div className="search-box">
                <Search size={17} />
                <input placeholder="Поиск чатов..." />
              </div>

              {chats.map(chat => (
                <button
                  key={chat.id}
                  className={
                    activeChat === chat.id
                      ? 'chat-list-item active'
                      : 'chat-list-item'
                  }
                  onClick={() => {
                    setActiveChat(chat.id);
                    setStickerPicker(false);
                  }}
                >
                  <div className="avatar">{chat.avatar}</div>

                  <div className="chat-list-copy">
                    <b>{chat.name}</b>
                    <span>{chat.preview}</span>
                  </div>

                  <small>{chat.time}</small>

                  {chat.unread > 0 && <i>{chat.unread}</i>}
                </button>
              ))}
            </div>

            <div className="chat-panel">
              <div className="chat-panel-header">
                <div className="avatar">{currentChat.avatar}</div>

                <div>
                  <b>{currentChat.name}</b>
                  <span>{currentChat.username}</span>
                </div>
              </div>

              <div className="chat-history">
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">💬</div>
                  <b>Начало переписки</b>
                  <span>
                    Отправь приветственное сообщение или стикер!
                  </span>

                  <button onClick={() => sendSticker('👋')}>
                    Отправить 👋
                  </button>
                </div>

                {currentMessages.map((text, index) => (
                  <div className="chat-message sent" key={index}>
                    {text}
                  </div>
                ))}
              </div>

              {stickerPicker && (
                <div className="sticker-picker">
                  {stickers.map(sticker => (
                    <button
                      key={sticker}
                      onClick={() => sendSticker(sticker)}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}

              <form className="message-form" onSubmit={sendMessage}>
                <button
                  type="button"
                  className="sticker-trigger"
                  onClick={() => setStickerPicker(value => !value)}
                  title="Стикеры"
                >
                  <Smile size={21} />
                </button>

                <input
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="Написать сообщение..."
                />

                <button type="submit" disabled={!message.trim()}>
                  <Send size={19} />
                </button>
              </form>

              <p className="chat-demo-note">
                Демонстрационный чат: сообщения пока сохраняются только в этом браузере.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="profile-page">
            <div className="profile-cover" />

            <div className="profile-details">
              <div className="avatar profile-avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Аватар профиля" />
                ) : (
                  profile?.display_name?.slice(0, 2).toUpperCase() || 'DV'
                )}
              </div>

              <h2>
                {profileLoading
                  ? 'Загрузка...'
                  : profile?.display_name || 'Пользователь'}
              </h2>

              <span>@{profile?.username || 'username'}</span>

              <p>
                {profile?.bio || 'Добро пожаловать в DV SOCIAL!'}
              </p>

              {profileError && (
                <p className="password-error">{profileError}</p>
              )}

              <div className="profile-stats">
                <b>
                  {posts.filter(post =>
                    post.username === `@${profile?.username}`
                  ).length} публикаций
                </b>

                <b>{following.length} подписок</b>
              </div>
            </div>

            <h3>Публикации</h3>

            {posts
              .filter(post => post.username === `@${profile?.username}`)
              .map(renderPost)}
          </section>
        )}

        {activeTab === 'settings' && renderSettings()}

        {activeTab === 'saved' && (
          <section className="page-content">
            <h2>Сохранённое</h2>

            {visiblePosts.length ? (
              visiblePosts.map(renderPost)
            ) : (
              <div className="empty-state">
                <Bookmark size={40} />
                <h2>Пока ничего нет</h2>
                <p>
                  Сохраняй интересные публикации, чтобы найти их здесь.
                </p>
              </div>
            )}
          </section>
        )}

        <footer className="mobile-navigation">
          {[
            { id: 'home', icon: Home },
            { id: 'search', icon: Search },
            { id: 'create', icon: PlusSquare },
            { id: 'explore', icon: Flame },
            { id: 'messages', icon: Mail },
            { id: 'profile', icon: User }
          ].map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={
                  activeTab === item.id ? 'mobile-active' : ''
                }
                onClick={() => setActiveTab(item.id as Tab)}
              >
                <Icon size={22} />
              </button>
            );
          })}
        </footer>
      </main>

      <aside className="right-sidebar">
        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Поиск..."
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setActiveTab('search');
            }}
          />
        </div>

        <div className="suggestion-card">
          <h3>Кого почитать</h3>

          {users.slice(0, 3).map(user => (
            <div className="suggestion" key={user.username}>
              <div className="avatar">{user.avatar}</div>

              <div className="user-info">
                <b>{user.name}</b>
                <span>{user.username}</span>
              </div>

              <button
                className="follow-button"
                onClick={() => toggleFollow(user.username)}
              >
                {following.includes(user.username) ? '✓' : '+'}
              </button>
            </div>
          ))}
        </div>

        <div className="right-footer">
          © 2026 DV SOCIAL
          <br />
          Твоя сеть. Твоё пространство.
        </div>
      </aside>
    </div>
  );
}

export default App;
