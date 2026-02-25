export default function FDAReference() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-600">
        FDA Pharmacokinetic Reference
      </h3>
      <div className="overflow-x-auto">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="text-left text-gray-500 border-b border-kawaii-pink/20">
              <th className="py-1 pr-2">Dose</th>
              <th className="py-1 pr-2">Cmax</th>
              <th className="py-1 pr-2">Cavg</th>
              <th className="py-1">Cmin (84h)</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr><td className="py-1 pr-2">0.025 mg/d</td><td className="pr-2">~33*</td><td className="pr-2">~22*</td><td>~20*</td></tr>
            <tr><td className="py-1 pr-2">0.0375 mg/d</td><td className="pr-2">46</td><td className="pr-2">34</td><td>30</td></tr>
            <tr><td className="py-1 pr-2">0.05 mg/d</td><td className="pr-2">83</td><td className="pr-2">57</td><td>41</td></tr>
            <tr><td className="py-1 pr-2">0.075 mg/d</td><td className="pr-2">99</td><td className="pr-2">72</td><td>60</td></tr>
            <tr><td className="py-1 pr-2">0.1 mg/d</td><td className="pr-2">133</td><td className="pr-2">89</td><td>90</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-400 leading-snug">
        *Extrapolated from dose proportionality. Values in pg/mL (above baseline). Source:{" "}
        <a
          href="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=d28bec8f-762e-4f05-a20d-96a42970d6a7"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-kawaii-pink-dark"
        >
          FDA DailyMed — Estradiol Transdermal System
        </a>
        {"; "}
        <a
          href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2014/020538s032lbl.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-kawaii-pink-dark"
        >
          Vivelle-Dot Prescribing Information
        </a>.
        Half-life after removal: 5.9–7.7 hours.
      </p>
    </div>
  );
}
