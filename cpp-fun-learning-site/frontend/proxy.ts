import { NextResponse, type NextRequest } from "next/server";
import {
  EXPERIMENT_COOKIE_NAMES,
  isAdminWorkbenchVariant,
  isAuthAccessVariant,
  isHomeHeroVariant,
  isPathAtlasVariant,
  isPathJourneyVariant,
  isProblemDetailApproachVariant,
  isProblemsStrategyVariant,
  pickRandomAdminWorkbenchVariant,
  pickRandomAuthAccessVariant,
  pickRandomHomeHeroVariant,
  pickRandomPathAtlasVariant,
  pickRandomPathJourneyVariant,
  pickRandomProblemDetailApproachVariant,
  pickRandomProblemsStrategyVariant
} from "./lib/experiments";

type CookieAssignment = {
  name: string;
  value: string;
};

function persistAssignment(response: NextResponse, assignment: CookieAssignment) {
  response.cookies.set(assignment.name, assignment.value, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function proxy(request: NextRequest) {
  const assignments: CookieAssignment[] = [];
  const currentHome = request.cookies.get(EXPERIMENT_COOKIE_NAMES.homeHero)?.value;
  if (!isHomeHeroVariant(currentHome)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.homeHero,
      value: pickRandomHomeHeroVariant()
    });
  }

  const currentAuth = request.cookies.get(EXPERIMENT_COOKIE_NAMES.authAccess)?.value;
  if (!isAuthAccessVariant(currentAuth)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.authAccess,
      value: pickRandomAuthAccessVariant()
    });
  }

  const currentProblems = request.cookies.get(EXPERIMENT_COOKIE_NAMES.problemsStrategy)?.value;
  if (!isProblemsStrategyVariant(currentProblems)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.problemsStrategy,
      value: pickRandomProblemsStrategyVariant()
    });
  }

  const currentDetail = request.cookies.get(
    EXPERIMENT_COOKIE_NAMES.problemDetailApproach
  )?.value;
  if (!isProblemDetailApproachVariant(currentDetail)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.problemDetailApproach,
      value: pickRandomProblemDetailApproachVariant()
    });
  }

  const currentAdmin = request.cookies.get(EXPERIMENT_COOKIE_NAMES.adminWorkbench)?.value;
  if (!isAdminWorkbenchVariant(currentAdmin)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.adminWorkbench,
      value: pickRandomAdminWorkbenchVariant()
    });
  }

  const currentPath = request.cookies.get(EXPERIMENT_COOKIE_NAMES.pathJourney)?.value;
  if (!isPathJourneyVariant(currentPath)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.pathJourney,
      value: pickRandomPathJourneyVariant()
    });
  }

  const currentAtlas = request.cookies.get(EXPERIMENT_COOKIE_NAMES.pathAtlas)?.value;
  if (!isPathAtlasVariant(currentAtlas)) {
    assignments.push({
      name: EXPERIMENT_COOKIE_NAMES.pathAtlas,
      value: pickRandomPathAtlasVariant()
    });
  }

  if (assignments.length === 0) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  assignments.forEach((assignment) => persistAssignment(response, assignment));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
