import Card from "@/components/Card";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-kawaii-cream">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-kawaii-pink-dark text-center">
          Terms of Use
        </h1>

        <Card>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p className="text-xs text-gray-400">
              Last updated: February 25, 2026
            </p>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Not a Medical Device</h2>
              <p>
                estrapatch is not a medical device, diagnostic tool, or clinical decision support
                system. It does not provide medical advice, diagnosis, or treatment. Nothing in this
                application should be interpreted as a recommendation to start, stop, or change any
                medication or treatment plan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Informational Use Only</h2>
              <p>
                All estradiol level estimates are generated using pharmacokinetic models derived from
                published FDA clinical studies conducted on post-menopausal cisgender women. These
                estimates are approximations and may differ significantly from your actual serum
                levels due to individual physiology, application site, body composition, concurrent
                medications, and other factors.
              </p>
              <p>
                Do not make decisions about hormone therapy, dosing, or scheduling based solely on
                this tool. Always consult a qualified healthcare provider.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">No Warranty</h2>
              <p>
                estrapatch is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
                warranties of any kind, whether express or implied, including but not limited to
                implied warranties of merchantability, fitness for a particular purpose, or
                non-infringement. The developer makes no warranty that the application will be
                accurate, reliable, error-free, or uninterrupted.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Assumption of Risk</h2>
              <p>
                You use estrapatch entirely at your own risk. The developer shall not be liable for
                any direct, indirect, incidental, special, consequential, or exemplary damages
                arising from your use of or inability to use this application, including but not
                limited to damages for loss of health, data, or other intangible losses.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Privacy and Data</h2>
              <p>
                estrapatch runs entirely in your browser. All data is stored locally on your device
                using IndexedDB. No personal data, health data, or usage data is transmitted to any
                server or third party. We use Vercel Analytics for anonymous, cookie-free page view
                counting only.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Open Source</h2>
              <p>
                estrapatch is open source software. The source code is available
                on{" "}
                <a
                  href="https://github.com/scott-yj-yang/estrapatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kawaii-pink hover:text-kawaii-pink-dark underline"
                >
                  GitHub
                </a>
                . You are free to inspect, fork, and modify the code subject to the terms of the
                project license.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Changes to These Terms</h2>
              <p>
                These terms may be updated at any time. The developer reserves the right to modify,
                suspend, or discontinue the application at any time without notice.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-kawaii-pink-dark">Contact</h2>
              <p>
                Questions, feedback, or bug reports can be submitted via{" "}
                <a
                  href="https://github.com/scott-yj-yang/estrapatch/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kawaii-pink hover:text-kawaii-pink-dark underline"
                >
                  GitHub Issues
                </a>
                .
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
