import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { PresenceData } from '../types';

export const setupPresence = (uid: string) => {
  const userStatusDatabaseRef = ref(rtdb, `/presence/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    // If not connected, return
    if (snapshot.val() === false) {
      return;
    }

    // Set up disconnect operations
    onDisconnect(userStatusDatabaseRef)
      .set({
        online: false,
        lastSeen: serverTimestamp(),
      })
      .then(() => {
        // Set online status to true
        set(userStatusDatabaseRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      });
  });

  return unsubscribe;
};

export const subscribeToPresence = (
  uid: string,
  callback: (presence: PresenceData | null) => void
) => {
  const presenceRef = ref(rtdb, `/presence/${uid}`);
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as PresenceData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
