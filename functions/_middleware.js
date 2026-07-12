// Edge middleware: 301 redirect any www.* host to the bare apex (non-www).
// Runs on Cloudflare Pages for every request before static assets are served.
export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
