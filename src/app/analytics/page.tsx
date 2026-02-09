export default function Analytics() {
  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <h3 className="font-semibold mb-4">Spend per leverantör</h3>
        <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl h-64 flex items-center justify-center">
          <p className="text-gray-500">Interaktiv graf här (Recharts i produktion)</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <p className="font-medium text-primary">AI-insikt</p>
        <p>Du kan spara ca 45 000 kr genom FortusFlex denna månad.</p>
      </div>
    </div>
  );
}
