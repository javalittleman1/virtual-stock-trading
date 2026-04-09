"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TrendingUp, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("demo@stock.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // 登录成功后跳转到行情页面
      router.push("/stocks");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
        {/* 主题切换 */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
      >
        {mounted && (theme === "dark" ? (
          <Sun className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Moon className="h-5 w-5 text-muted-foreground" />
        ))}
      </button>

      {/* Logo 区域 */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-guzhang-primary">股掌</h1>
        </div>
        <p className="text-guzhang-secondary">仿真交易 · 智能复盘</p>
      </div>

      {/* 登录表单 */}
      <div className="bg-card rounded-[28px] p-6 border border-guzhang shadow-sm">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-guzhang-secondary text-sm">手机号 / 邮箱</Label>
            <Input
              id="email"
              type="text"
              placeholder="请输入手机号或邮箱"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-[20px] border-guzhang-input bg-guzhang-input text-base px-4"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-guzhang-secondary text-sm">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-[20px] border-guzhang-input bg-guzhang-input text-base px-4"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 rounded-[48px] text-lg font-bold bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "登录中..." : "登 录"}
          </Button>

          <div className="text-center text-sm text-guzhang-secondary">
            <Link href="/auth/forgot-password" className="hover:underline">
              忘记密码？
            </Link>
            <span className="mx-2">·</span>
            <Link href="/auth/sign-up" className="hover:underline">
              立即注册
            </Link>
          </div>
        </form>
      </div>

      {/* 演示账号提示 */}
      <p className="text-center text-sm text-guzhang-secondary">
        演示账号：demo@stock.com / 123456
      </p>
    </div>
  );
}
