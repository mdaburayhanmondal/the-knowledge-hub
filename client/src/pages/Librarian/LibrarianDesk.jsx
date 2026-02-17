import LibrarianStats from '../../components/LibrarianStats';
import OverdueManager from '../../components/OverdueManager';
import SystemMaintenance from '../../components/SystemMaintenance';
import ReturnBook from './ReturnBook';

const LibrarianDesk = () => {
  return (
    <section className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 mx-auto w-fit italic">
        Librarian Desk
      </h1>
      <div className="w-full flex flex-col items-center justify-center mx-auto gap-y-10">
        <LibrarianStats />
        <div className="w-full">
          <h1 className="text-2xl font-semibold pl-4 pb-2">
            <span className="text-green-700">Return</span>
            {' | '}
            <span className="text-red-700">Pay Fine & Renew</span>
          </h1>
          <ReturnBook />
        </div>
        <OverdueManager />
        <SystemMaintenance />
      </div>
    </section>
  );
};

export default LibrarianDesk;
