import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_dev_only",
});

export const config = {
  matcher: ["/admin/:path*"],
};
