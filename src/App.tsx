import { useRef, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { FeedingForm } from "./components/FeedingForm";
import { ScheduleDisplay } from "./components/ScheduleDisplay";
import { Footer } from "./components/Footer";
import { Button } from "./components/ui/Button";
import { useSchedule } from "./hooks/useSchedule";
import { RotateCcw } from "lucide-react";

function App() {
  const { schedule, calculate, reset } = useSchedule();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (schedule) {
      setShowResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setShowResults(false);
    }
  }, [schedule]);

  function handleReset() {
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 sm:px-6">
      <Header />

      <main className="flex flex-col gap-8 pb-4">
        <FeedingForm onCalculate={calculate} />

        {schedule && (
          <div
            ref={resultsRef}
            className={`flex flex-col gap-8 transition-all duration-500 ${
              showResults
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <ScheduleDisplay schedule={schedule} />

            <div className="flex justify-center">
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
