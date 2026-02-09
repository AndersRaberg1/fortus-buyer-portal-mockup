import * as Progress from '@radix-ui/react-progress';

export default function CreditCard() {
  const progress = 75; // 1.25M av 1.5M

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
      <p className="text-gray-500 text-lg">Tillgänglig kredit</p>
      <p className="text-5xl font-bold text-primary my-6">1 250 000 kr</p>
      <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-64 h-64 mx-auto">
        <Progress.Indicator className="bg-primary w-full h-full rounded-full" style={{ transform: `translateX(-${100 - progress}%)` }} />
      </Progress.Root>
      <p className="text-2xl mt-6">av total limit 1 500 000 kr</p>
    </div>
  );
}