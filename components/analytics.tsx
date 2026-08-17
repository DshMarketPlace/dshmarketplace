const GA_ID = "G-R6HWVQVVVB";

/**
 * Plain tags rather than next/script: the afterInteractive strategy injected
 * reliably on the prerendered pages but not on the dynamic catalogue route,
 * which is the one page that matters most for traffic. async keeps it off the
 * critical path.
 */
export function Analytics() {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
        }}
      />
    </>
  );
}
