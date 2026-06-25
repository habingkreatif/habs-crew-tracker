import { NextResponse } from 'next/server';

type SuccessResponse<T> = {
  success: true;
  data: T;
};

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<SuccessResponse<T>>({ success: true, data }, { status });
}

export function apiError(message: string, code = 'INTERNAL_ERROR', status = 500) {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}
