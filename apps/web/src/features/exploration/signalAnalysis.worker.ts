import { analyzeContacts } from "./signalGeometry";
import type { StudySite } from "./signalGeometry";
import type { SignalScenario } from "./signalScenario";
self.onmessage = (
  event: MessageEvent<{
    data: SignalScenario;
    site: StudySite;
    selected: number;
  }>,
) => {
  try {
    const { data, site, selected } = event.data;
    self.postMessage({ result: analyzeContacts(data, site, selected) });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
