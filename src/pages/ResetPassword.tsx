import { useNavigate } from "react-router-dom";
import { ForgotPassword } from "@/components/ForgotPassword";

export default function ResetPassword() {
  const navigate = useNavigate();
  return <ForgotPassword onBack={() => navigate("/")} />;
}
