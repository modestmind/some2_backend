import { SajuProfile } from "../../generated/prisma/client.js";

type SajuProfileData = {
  isSelf: string;
  name: string;
  gender: string;
  birthDate: Date;
  calendarType: string;
  birthTime: Date | null;
  relationshipType: string | null;
  relationDuration: string | null;
  relationshipStatus: string | null;
};

export type SajuProfileListItem = Pick<
  SajuProfile,
  "name" | "gender" | "relationshipType" | "relationDuration" | "relationshipStatus" | "createdAt" | "reportYn"
>;

export interface ISajuProfileRepo {
  findSelfProfile: (userId: string) => Promise<SajuProfile | null>;
  findOtherProfiles: (userId: string) => Promise<SajuProfileListItem[]>;
  create: (params: { userId: string } & SajuProfileData) => Promise<SajuProfile>;
  update: (params: { sajuProfileId: bigint } & SajuProfileData) => Promise<SajuProfile>;
}
