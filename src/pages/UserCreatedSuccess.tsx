import { useUserStore } from '@/stores/useUserStore';
import { Link } from 'react-router';

const UserCreatedSuccess = () => {
  const { currentUser } = useUserStore();
  return (
    <>
      <div
        className="pointer-events-none fixed top-1/2 left-1/2 z-0 h-full w-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(19, 91, 236, 0.15) 0%, rgba(16, 185, 129, 0.1) 30%, rgba(5, 5, 5, 0) 70%)',
        }}
      ></div>
      <div className="pointer-events-none fixed top-[20%] right-[10%] z-0 h-100 w-100 rounded-full bg-primary/10 blur-[120px]"></div>
      <div className="bg-success-green/10 pointer-events-none fixed bottom-[20%] left-[10%] z-0 h-87.5 w-87.5 rounded-full blur-[100px]"></div>
      <div className="relative z-10 m-auto flex h-full w-full max-w-240 grow flex-col">
        <div className="mt-5 px-6 py-6 md:px-10">
          <div
            className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 backdrop-blur-md md:flex-row"
            style={{ boxShadow: '0 0 20px rgba(19, 91, 236, 0.2)' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary">info</span>
              <p className="text-sm leading-relaxed font-medium text-white/90 md:text-base">
                Welcome to FinTrack! Everything you enter is stored locally in your browser. Make
                sure to back up or export your data before clearing storage.
              </p>
            </div>
            <button
              onClick={(e) => {
                const parent = (e.currentTarget as HTMLElement).parentElement;
                if (parent) {
                  parent.style.display = 'none';
                }
              }}
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/20"
            >
              Got it 👍
            </button>
          </div>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-6">
          <div className="relative mb-8">
            <div className="border-success-green bg-success-green/10 flex size-24 items-center justify-center rounded-full border-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-success-green text-5xl font-bold">
                check
              </span>
            </div>
            <div className="border-success-green/30 absolute inset-0 animate-ping rounded-full border opacity-20"></div>
          </div>
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-[36px] leading-tight font-extrabold tracking-tight text-white md:text-[42px]">
              Profile Successfully Created!
            </h1>
            <p className="text-lg font-normal text-[#9da6b9]">
              Everything is ready. Welcome to your new financial journey.
            </p>
          </div>
          <div className="mb-12 flex w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-4">
                <div className="aspect-square rounded-full border-2 border-primary/50 bg-cover bg-center bg-no-repeat p-1">
                  <div className="size-20 overflow-hidden rounded-full">
                    <img
                      alt="Profile Avatar"
                      className="h-full w-full object-cover"
                      src={currentUser?.avatar ?? './assets/avatar.png'}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-center text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
                    {currentUser?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-4 px-4">
            <Link
              to={`/dashboard`}
              className="flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary text-lg leading-normal font-bold tracking-[0.015em] text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              <span className="truncate">Continue to Dashboard</span>
            </Link>
            <Link
              className="py-2 text-center text-sm leading-normal font-medium text-[#9da6b9] underline transition-colors hover:text-white"
              to={`/edit-profile?id=${currentUser?.id}`}
            >
              Edit Profile Details
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserCreatedSuccess;
