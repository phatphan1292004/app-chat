import { useAuth } from "../hooks/useAuth";

interface AuthProps {
  onLoginSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const {
    isLogin,
    user,
    pass,
    showPass,
    loading,
    error,
    success,
    setUser,
    setPass,
    setShowPass,
    submit,
    toggleMode,
  } = useAuth({ onLoginSuccess });

  return (
    <>
      <div className="fixed right-5 top-5 z-50 space-y-2">
        {error && (
          <div className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white shadow">
            ✅ {success}
          </div>
        )}
      </div>

      <div className="flex min-h-screen items-center justify-center from-[#eaf2ff] to-white">
        <div className="w-[360px] rounded-xl bg-white px-8 py-7 shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
          <h2 className="mb-6 text-center text-[22px] font-semibold text-primary-1">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </h2>

          <input
            className="mb-3 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm
                       focus:border-primary-1 focus:ring-1 focus:ring-primary-1 focus:outline-none"
            placeholder="Tài khoản"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />

          <div className="relative mb-4">
            <input
              type={showPass ? "text" : "password"}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 pr-12 text-sm
                         focus:border-primary-1 focus:ring-1 focus:ring-primary-1 focus:outline-none"
              placeholder="Mật khẩu"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-gray-600"
            >
              {showPass ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.4 21.4 0 0 1 5.06-5.94" />
                  <path d="M1 1l22 22" />
                  <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-lg bg-primary-1 py-2.5
                       text-sm font-semibold text-white
                       transition hover:bg-primary-1/80
                       disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-600">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
            <span
              className="ml-1 cursor-pointer font-medium
                         text-primary-1 hover:underline"
              onClick={toggleMode}
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
