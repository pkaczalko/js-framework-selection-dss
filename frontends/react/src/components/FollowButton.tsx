import { useState } from 'react';
import { api } from '../api/client';
import type { Profile } from '../api/types';
import { useAuth } from '../hooks/useAuth';

interface FollowButtonProps {
  profile: Profile;
  onChange?: (profile: Profile) => void;
}

export function FollowButton({ profile, onChange }: FollowButtonProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user || user.username === profile.username) {
    return null;
  }

  async function toggleFollow() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = profile.following
        ? await api.unfollowProfile(profile.username)
        : await api.followProfile(profile.username);
      onChange?.(result.profile);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm${profile.following ? ' btn-outline-secondary' : ' btn-outline-primary'}`}
      disabled={busy}
      onClick={toggleFollow}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
