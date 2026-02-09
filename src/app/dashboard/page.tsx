import CreditCard from "@/components/CreditCard";
import CashFlowChart from "@/components/CashFlowChart";

export default function Dashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Hej, Företag AB!</h2>
      
      <CreditCard />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">Kommande betalningar</p>
          <p className="text-3xl font-bold">320 000 kr</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">Purchasing power</p>
          <p className="text-3xl font-bold text-green-600">980 000 kr</p>
        </div>
      </div>

      <CashFlowChart />

      <button className="w-full bg-primary text-white py-4 rounded-lg font-medium mt-8">
        Ladda upp ny faktura
      </button>
    </div>
  );
}
