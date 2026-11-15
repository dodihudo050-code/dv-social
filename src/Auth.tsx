import { useState, type FormEvent } from 'react';
import { supabase } from './lib/supabase';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

type AuthMode = 'login' | 'register' | 'reset';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Введи адрес электронной почты.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: window.location.origin,
        });

        if (error) throw error;

        setMessage('Если для этого адреса есть аккаунт, на почту придёт ссылка для восстановления пароля.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить письмо. Попробуй ещё раз.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register' && name.trim().length < 2) {
      setError('Введи имя длиной не менее 2 символов.');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Аккаунт создан. Добро пожаловать в DV SOCIAL!');
        } else {
          setMessage('Если регистрация прошла успешно, проверь почту и подтверди адрес, чтобы войти.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        setMessage('Вход выполнен!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить операцию. Проверь данные и попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  const isReset = mode === 'reset';
  const isRegister = mode === 'register';

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
          <h1>
            {isReset
              ? 'Восстановление доступа'
              : isRegister
                ? 'Создай свой аккаунт'
                : 'С возвращением!'}
          </h1>
          <p>
            {isReset
              ? 'Укажи email, связанный с аккаунтом, и мы отправим ссылку для сброса пароля.'
              : isRegister
                ? 'Укажи свою почту — для входа может потребоваться её подтверждение.'
                : 'Войди в своё пространство DV SOCIAL.'}
          </p>
        </div>

        {!isReset && (
          <div className="auth-tabs">
            <button
              type="button"
              className={isRegister ? 'active' : ''}
              onClick={() => changeMode('register')}
            >
              Регистрация
            </button>
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
            >
              Вход
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              <span>Твоё имя</span>
              <div className="auth-input">
                <User size={19} />
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Как тебя называть?"
                  autoComplete="name"
                  minLength={2}
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

          {!isReset && (
            <>
              <label>
                <span>Пароль</span>
                <div className="auth-input">
                  <Lock size={19} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Минимум 8 символов"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    minLength={8}
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

              {isRegister && (
                <label>
                  <span>Повтори пароль</span>
                  <div className="auth-input">
                    <Lock size={19} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      placeholder="Повтори пароль"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                </label>
              )}
            </>
          )}

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}
          {message && <div className="auth-message auth-success" role="status">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Подожди...'
              : isReset
                ? 'Отправить ссылку'
                : isRegister
                  ? 'Создать аккаунт'
                  : 'Войти в DV SOCIAL'}
          </button>
        </form>

        {isReset ? (
          <button className="auth-link" type="button" onClick={() => changeMode('login')}>
            Вернуться ко входу
          </button>
        ) : mode === 'login' ? (
          <button className="auth-link" type="button" onClick={() => changeMode('reset')}>
            Забыли пароль?
          </button>
        ) : null}

        <p className="auth-terms">
          Используй адрес почты, к которому у тебя есть доступ: для подтверждения регистрации потребуется открыть письмо.
        </p>
      </section>

      <footer className="auth-footer">
        DV SOCIAL · Твоя сеть. Твоё пространство.
      </footer>
    </main>
  );
}
