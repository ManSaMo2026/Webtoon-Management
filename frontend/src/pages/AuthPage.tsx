import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Brand } from "../components/layout/PublicHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/FormField";
import { useAuth } from "../contexts/AuthContext";

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || "서버에 연결할 수 없습니다.";
  return "처리 중 오류가 발생했습니다.";
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "", name: "", penName: "" });

  if (user) return <Navigate to="/projects" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLogin && form.password !== form.passwordConfirm) {
      toast.error("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await signup({ email: form.email, password: form.password, name: form.name, penName: form.penName });
      toast.success(isLogin ? "로그인되었습니다." : "회원가입이 완료되었습니다.");
      navigate("/projects");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between"><Brand /><Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft size={14} />홈으로</Link></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8"><p className="text-xs font-bold uppercase tracking-widest text-primary">{isLogin ? "Welcome back" : "Create account"}</p><h1 className="mt-3 text-3xl font-bold tracking-tight">{isLogin ? "다시 만나서 반가워요" : "창작 관리를 시작해보세요"}</h1><p className="mt-3 text-sm text-muted-foreground">{isLogin ? "계정에 로그인하고 작업을 이어가세요." : "간단한 정보만 입력하면 바로 시작할 수 있습니다."}</p></div>
          <form className="space-y-4" onSubmit={submit}>
            {!isLogin && <div className="grid gap-4 sm:grid-cols-2"><Input label="이름" required value={form.name} onChange={update("name")} placeholder="홍길동" autoComplete="name" /><Input label="작가명" value={form.penName} onChange={update("penName")} placeholder="선택 입력" /></div>}
            <Input label="이메일" type="email" required value={form.email} onChange={update("email")} placeholder="creator@example.com" autoComplete="email" />
            <Input label="비밀번호" type="password" required minLength={8} value={form.password} onChange={update("password")} placeholder="8자 이상 입력" autoComplete={isLogin ? "current-password" : "new-password"} />
            {!isLogin && <Input label="비밀번호 확인" type="password" required minLength={8} value={form.passwordConfirm} onChange={update("passwordConfirm")} placeholder="비밀번호 재입력" autoComplete="new-password" />}
            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">{isLogin ? "로그인" : "회원가입"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">{isLogin ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"} <Link to={isLogin ? "/signup" : "/login"} className="font-semibold text-primary hover:underline">{isLogin ? "회원가입" : "로그인"}</Link></p>
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-sidebar p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative mt-auto mb-auto max-w-lg"><span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">웹툰 창작자의 작업 파트너</span><h2 className="mt-6 text-4xl font-bold leading-tight">아이디어는 놓치지 않고,<br />마감은 미리 준비하세요.</h2><p className="mt-5 text-sm leading-7 text-indigo-200">여러 문서에 흩어진 작품 정보와 일정을 하나의 프로젝트로 정리해 창작의 흐름을 지켜드립니다.</p><ul className="mt-8 space-y-4">{["작품별 스토리와 설정 관리", "회차 진행률과 일정 리스크 확인", "브라우저에서 언제든 이어서 작업"].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-indigo-100"><CheckCircle2 size={17} className="text-indigo-300" />{item}</li>)}</ul></div>
        <p className="relative text-xs text-indigo-300">WEBTOON MAKER · Creative workflow</p>
      </aside>
    </div>
  );
}
