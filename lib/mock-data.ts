import type { Player } from "@/lib/types"

interface MockPlayerOptions {
  id: number
  firstName: string
  lastName: string
  gender?: "MALE" | "FEMALE"
  age?: number
  contactNumber?: string
  address?: string
  createdAt?: string
}

const DEFAULT_CREATED_AT = "2024-01-01T00:00:00Z"

export function createMockPlayer({
  id,
  firstName,
  lastName,
  gender = "MALE",
  age = 30,
  contactNumber = "",
  address = "",
  createdAt = DEFAULT_CREATED_AT,
}: MockPlayerOptions): Player {
  return {
    id,
    name: `${firstName} ${lastName}`,
    age,
    gender,
    address,
    contactNumber,
    createdAt,
    firstName,
    lastName,
  }
}
