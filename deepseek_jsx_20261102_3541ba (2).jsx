import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useParams,
  useLocation,
  useNavigate,
} from 'react-router-dom';

// ============================================================================
// 1. ТИПИЗАЦИЯ (Критерий 2 — типизация useParams)
// ============================================================================
export interface User {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
}

// Тип для state, который PrivateRoute передаёт в Navigate
interface LocationState {
  from?: { pathname: string; search?: string };
}

// ============================================================================
// 2. КОНТЕКСТ АВТОРИЗАЦИИ (перенос из предыдущих тем 3.1–3.2)
// ============================================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Восстановление пользователя из localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Ошибка чтения пользователя из localStorage', e);
      }
    }
  }, []);

  const login = (name: string) => {
    const newUser: User = { id: Date.now().toString(), name };
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться строго внутри AuthProvider');
  }
  return context;
};

// ============================================================================
// 3. МОКОВЫЕ ДАННЫЕ (для динамического маршрута)
// ============================================================================
const PRODUCTS: Product[] = [
  { id: '1', title: 'Ноутбук',    price: 75000, description: 'Мощный ноутбук для учёбы и работы.' },
  { id: '2', title: 'Смартфон',   price: 45000, description: 'Флагман с хорошей камерой.' },
  { id: '3', title: 'Наушники',   price: 8000,  description: 'Беспроводные, с шумоподавлением.' },
  { id: '4', title: 'Клавиатура', price: 5500,  description: 'Механическая, с подсветкой.' },
];

// ============================================================================
// 4. НАВИГАЦИЯ (Критерий 4 — только Link / NavLink, без тега <a>)
// ============================================================================
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();

  // Функция стиля NavLink с подсветкой активного пункта
  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    padding: '8px 14px',
    marginRight: '4px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '15px',
    color: isActive ? 'white' : '#cfd8dc',
    backgroundColor: isActive ? '#3949ab' : 'transparent',
    transition: 'all 0.2s ease',
  });

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '10px 15px',
        backgroundColor: '#1a237e',
        borderRadius: '8px 8px 0 0',
      }}
    >
      <NavLink to="/" end style={linkStyle}>Главная</NavLink>
      <NavLink to="/products" style={linkStyle}>Товары</NavLink>
      <NavLink to="/about" style={linkStyle}>О нас</NavLink>
      <NavLink to="/profile" style={linkStyle}>Профиль</NavLink>

      <span style={{ flex: 1 }} />

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'white' }}>👤 {user.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Выйти
          </button>
        </div>
      ) : (
        <NavLink to="/login" style={linkStyle}>Войти</NavLink>
      )}
    </nav>
  );
};

// ============================================================================
// 5. PRIVATE ROUTE (Критерий 3 — защищённый маршрут + возврат на исходную страницу)
// ============================================================================
const PrivateRoute: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Если не авторизован — редирект на /login,
  // при этом в state кладём текущий location, чтобы потом вернуться обратно
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// ============================================================================
// 6. СТРАНИЦЫ ПРИЛОЖЕНИЯ
// ============================================================================

// --- Главная ---
const HomePage: React.FC = () => (
  <div>
    <h2 style={{ color: '#1a237e' }}>Главная</h2>
    <p>Добро пожаловать! Это учебное приложение с клиентской маршрутизацией.</p>
    <p>
      Перейдите в <Link to="/products">каталог товаров</Link> или загляните в{' '}
      <Link to="/profile">профиль</Link> (доступен только после входа).
    </p>
  </div>
);

// --- Список товаров ---
const ProductsPage: React.FC = () => (
  <div>
    <h2 style={{ color: '#1a237e' }}>Товары</h2>
    <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
      {PRODUCTS.map((p) => (
        <li
          key={p.id}
          style={{
            padding: '12px 15px',
            margin: '8px 0',
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
          }}
        >
          {/* Внутренние переходы — только через Link */}
          <Link to={`/products/${p.id}`} style={{ color: '#1a237e', fontWeight: 'bold', textDecoration: 'none' }}>
            {p.title}
          </Link>
          {' — '}
          {p.price.toLocaleString('ru-RU')} ₽
        </li>
      ))}
    </ul>
  </div>
);

// --- Карточка товара (динамический маршрут) ---
const ProductPage: React.FC = () => {
  // Критерий 2 — типизированное чтение параметра через useParams
  const { id } = useParams<{ id: string }>();
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <div>
        <h2 style={{ color: '#c62828' }}>Товар не найден</h2>
        <p>Товара с идентификатором «{id}» не существует.</p>
        <Link to="/products" style={{ color: '#1a237e' }}>← Вернуться к списку товаров</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#1a237e' }}>{product.title}</h2>
      <p style={{ fontSize: '20px', color: '#2e7d32', fontWeight: 'bold' }}>
        {product.price.toLocaleString('ru-RU')} ₽
      </p>
      <p>{product.description}</p>
      <p style={{ color: '#888', fontSize: '14px' }}>ID маршрута: /products/{id}</p>
      <Link to="/products" style={{ color: '#1a237e' }}>← Назад к товарам</Link>
    </div>
  );
};

// --- О нас ---
const AboutPage: React.FC = () => (
  <div>
    <h2 style={{ color: '#1a237e' }}>О нас</h2>
    <p>Учебный проект по дисциплине «Разработка веб-приложений (React)».</p>
    <p>Раздел 3 — Роутинг и навигация, тема 3.3.</p>
  </div>
);

// --- Профиль (защищённая страница) ---
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <h2 style={{ color: '#1a237e' }}>Личный кабинет</h2>
      <p>Вы вошли как <strong>{user?.name}</strong>.</p>
      <p style={{ color: '#555' }}>Эта страница доступна только авторизованным пользователям.</p>
    </div>
  );
};

// --- Страница входа (Критерий 3 — возврат на исходную страницу) ---
const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Читаем state, который передал PrivateRoute
  const state = location.state as LocationState | null;
  const from = state?.from
    ? `${state.from.pathname}${state.from.search ?? ''}`
    : '/';

  const [inputValue, setInputValue] = useState('');

  // Если уже авторизован — сразу отправляем на исходную страницу
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputValue.trim();
    if (!name) return;

    login(name);
    // Возврат на страницу, которую пользователь пытался открыть
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h2 style={{ color: '#1a237e' }}>Вход</h2>

      {state?.from && (
        <p
          style={{
            padding: '10px 14px',
            backgroundColor: '#fff8e1',
            border: '1px solid #fbc02d',
            borderRadius: '6px',
            color: '#795548',
          }}
        >
          Для доступа к странице <code>{state.from.pathname}</code> требуется авторизация.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '340px',
          padding: '15px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          backgroundColor: '#fafafa',
        }}
      >
        <label htmlFor="username" style={{ color: '#333' }}>Имя пользователя</label>
        <input
          id="username"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Например, student"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          style={{
            padding: '8px',
            cursor: 'pointer',
            backgroundColor: '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Войти
        </button>
      </form>
    </div>
  );
};

// --- Страница 404 ---
const NotFoundPage: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <h2 style={{ color: '#c62828', fontSize: '36px', margin: '0 0 10px' }}>404</h2>
    <p>Страница не найдена. Такого маршрута не существует.</p>
    <Link to="/" style={{ color: '#1a237e' }}>← На главную</Link>
  </div>
);

// ============================================================================
// 7. КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// ============================================================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          style={{
            maxWidth: '850px',
            margin: '20px auto',
            fontFamily: 'Segoe UI, sans-serif',
          }}
        >
          <Navigation />

          <div
            style={{
              padding: '25px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              minHeight: '350px',
            }}
          >
            <Routes>
              {/* --- 4 статических маршрута (Критерий 1) --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* --- Динамический маршрут (Критерий 2) --- */}
              <Route path="/products/:id" element={<ProductPage />} />

              {/* --- Защищённый маршрут (Критерий 3) --- */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* --- 404 --- */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;