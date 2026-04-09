import { redirect } from "next/navigation";

// 首页直接跳转到登录页面
// 登录后的跳转逻辑在登录表单中处理
export default function Home() {
  redirect("/auth/login");
}
