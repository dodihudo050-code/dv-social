
import { useState, type FormEvent } from 'react';
import { supabase } from './lib/supabase';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'register' && name.trim().length < 2) {
      setError('Введи имя длиной не менее 2 символов.');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Аккаунт создан! Добро пожаловать в DV SOCIAL.');
        } else {
          setMessage('Аккаунт создан. Проверь почту и подтверди адрес, чтобы войти.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setMessage('Вход выполнен!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить операцию.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">DV</div>
          <span>DV SOCIAL</span>
        </div>

        <div className="auth-heading">
          <div className="auth-sparkle"><Sparkles size={22} /></div>
          <h1>{mode === 'register' ? 'Создай свой аккаунт' : 'С возвращением!'}</h1>
          <p>
            {mode === 'register'
              ? 'Присоединяйся к новому цифровому пространству.'
              : 'Войди в своё пространство DV SOCIAL.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); setMessage(''); }}
          >
            Регистрация
          </button>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); setMessage(''); }}
          >
            Вход
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Твоё имя</span>
              <div className="auth-input">
                <User size={19} />
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Как тебя называть?"
                  autoComplete="name"
                  required
                />
              </div>
            </label>
          )}

          <label>
            <span>Электронная почта</span>
            <div className="auth-input">
              <Mail size={19} />
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Пароль</span>
            <div className="auth-input">
              <Lock size={19} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Минимум 8 символов"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword(value => !value)}
                aria-label="Показать или скрыть пароль"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Подожди...'
              : mode === 'register'
                ? 'Создать аккаунт'
                : 'Войти в DV SOCIAL'}
          </button>
        </form>

        <p className="auth-terms">
          Продолжая, ты соглашаешься соблюдать правила использования сервиса.
        </p>
      </section>

      <footer className="auth-footer">
        DV SOCIAL · Твоя сеть. Твоё пространство.
      </footer>
    </main>
  );
}
