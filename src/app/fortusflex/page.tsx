import FeeCalculator from "@/components/FeeCalculator";

export default function FortusFlex() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">FortusFlex</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
        <p className="font-medium mb-6">Ladda upp leverantörsfaktura</p>
        <div className="border-2 border-dashed rounded-xl p-12 text-center mb-8">
          <p className="text-gray-500">Dra och släpp PDF</p>
        </div>

        <FeeCalculator />

        <button className="w-full bg-primary text-white py-4 rounded-lg font-medium mt-8">
          Signera med BankID
        </button>
      </div>
    </div>
  );
}
