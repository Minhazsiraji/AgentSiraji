const PIXEL_ID = "1054067190449122";

export default function MetaSetupPage() {
  return (
    <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Meta Pixel setup diagnostic</h1>
      <p>This temporary noindex page exists only to let Meta&apos;s Event Setup Tool detect the AgentSiraji Pixel.</p>
      <p><strong>Pixel ID:</strong> {PIXEL_ID}</p>
      <p><strong>Status:</strong> Standard Meta Pixel bootstrap rendered in the initial page HTML and PageView sent.</p>
      <p>No Lead, Contact, Purchase, or checkout events are generated here.</p>
    </main>
  );
}
