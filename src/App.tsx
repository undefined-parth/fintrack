import { PasswordVerificationModal } from '@/components/PasswordVerificationModal';
import { useUserStore } from '@/stores/useUserStore';
import type { User } from '@/types';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

const ProfileAvatar = ({
  id,
  name,
  avatar,
  password,
  setIsPasswordVerificationModalOpen,
  setSelectedUser,
  isEditingProfile,
}: {
  id: string;
  name: string;
  avatar: string | undefined;
  password: string;
  setIsPasswordVerificationModalOpen: (open: boolean) => void;
  setSelectedUser: (user: Partial<User>) => void;
  isEditingProfile: boolean;
}) => {
  return (
    <button
      onClick={() => {
        setIsPasswordVerificationModalOpen(true);
        setSelectedUser({ id, name, avatar, password });
      }}
      className="profile-card group flex flex-col items-center transition-all duration-300"
    >
      <div className="profile-circle relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-outline-variant/20 transition-all duration-300 md:h-44 md:w-44">
        <img alt="User 1 avatar" className="h-full w-full object-cover" src={avatar} />
        <div className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {isEditingProfile && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity">
            <span className="text-3xl text-on-surface md:text-4xl">✏️</span>
          </div>
        )}
      </div>
      <span className="profile-name text-lg font-medium text-on-surface-variant transition-colors md:text-xl">
        {name}
      </span>
    </button>
  );
};

function App() {
  const { users, loginUser, currentUser } = useUserStore();
  const [isPasswordVerificationModalOpen, setIsPasswordVerificationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center font-sans text-on-surface">
        <div className="w-full max-w-4xl px-6 py-12 text-center">
          <h1 className="mb-16 font-display text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Who's Using?
          </h1>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {users.map((user) => (
              <ProfileAvatar
                key={user.id}
                id={user.id}
                name={user.name}
                avatar={user.avatar || 'src/assets/avatar.png'}
                password={user.password}
                setIsPasswordVerificationModalOpen={setIsPasswordVerificationModalOpen}
                setSelectedUser={setSelectedUser}
                isEditingProfile={isEditingProfile}
              />
            ))}

            <Link
              to="/add-user"
              className="profile-card group flex flex-col items-center transition-all duration-300"
            >
              <div className="profile-circle mb-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-outline-variant/20 bg-surface-container transition-all duration-300 group-hover:border-primary group-hover:bg-primary/5 md:h-44 md:w-44">
                <span className="text-5xl text-on-surface-variant transition-colors group-hover:text-primary md:text-6xl">
                  +
                </span>
              </div>
              <span className="profile-name text-lg font-medium text-on-surface-variant transition-colors md:text-xl">
                Add User
              </span>
            </Link>
          </div>

          <div className="mt-24">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="rounded-full border border-outline-variant/20 px-8 py-3 text-sm font-semibold tracking-widest text-on-surface-variant uppercase transition-all duration-300 hover:border-primary/30 hover:text-primary"
            >
              {isEditingProfile ? 'Done' : 'Manage Profiles'}
            </button>
          </div>
        </div>
      </div>

      <PasswordVerificationModal
        isOpen={isPasswordVerificationModalOpen}
        onClose={() => setIsPasswordVerificationModalOpen(false)}
        nextStep={
          isEditingProfile
            ? () => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                navigate('/edit-profile');
              }
            : () => {
                loginUser(selectedUser?.name || '', selectedUser?.password || '');
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                navigate('/dashboard');
              }
        }
        errorMessage="Incorrect password. Try again."
        user={selectedUser}
      />
    </>
  );
}

export default App;
