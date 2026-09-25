// src/lib/utils.ts
import { getChallengeCollection } from '@/lib/challenge';
import { Challenge } from '@/types/challenge';

export const getChallengeById = async (challengeId: string): Promise<Challenge | null> => {
  const coll = await getChallengeCollection();
  const challenge = await coll.findOne({ challengeId });
  return challenge as Challenge | null;
};
