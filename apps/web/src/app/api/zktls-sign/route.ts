/**
 * zkTLS Sign API
 *
 * This endpoint handles the signing of zkTLS requests.
 * The sign() method requires appSecret and can only be called server-side.
 */

import { NextRequest, NextResponse } from 'next/server';

// Lazy-load SDK to avoid issues
let primusSdk: any = null;
let sdkInitialized = false;

async function initSdk() {
  if (sdkInitialized) return primusSdk;

  const appId = process.env.PRIMUS_APP_ID;
  const appSecret = process.env.PRIMUS_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('[zkTLS Sign API] Missing PRIMUS_APP_ID or PRIMUS_APP_SECRET');
    return null;
  }

  try {
    const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
    primusSdk = new PrimusZKTLS();
    await primusSdk.init(appId, appSecret);
    sdkInitialized = true;
    console.log('[zkTLS Sign API] SDK initialized successfully');
    return primusSdk;
  } catch (error) {
    console.error('[zkTLS Sign API] SDK init failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requestStr } = await request.json();

    if (!requestStr) {
      return NextResponse.json(
        { error: 'Missing requestStr parameter' },
        { status: 400 }
      );
    }

    const sdk = await initSdk();
    if (!sdk) {
      return NextResponse.json(
        { error: 'Primus SDK not configured' },
        { status: 500 }
      );
    }

    // Sign the request using appSecret
    console.log('[zkTLS Sign API] Signing request...');

    // Validate the request contains appId before signing
    try {
      const parsed = JSON.parse(requestStr);
      console.log('[zkTLS Sign API] Request appId:', parsed.appId || '(empty)');
      console.log('[zkTLS Sign API] Request attTemplateID:', parsed.attTemplateID || '(empty)');
      if (!parsed.appId) {
        return NextResponse.json(
          { error: 'Request is missing appId. Check NEXT_PUBLIC_PRIMUS_APP_ID environment variable.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid requestStr JSON' },
        { status: 400 }
      );
    }

    const signedRequestStr = await sdk.sign(requestStr);
    console.log('[zkTLS Sign API] Request signed successfully');

    return NextResponse.json({ signedRequestStr });
  } catch (error) {
    console.error('[zkTLS Sign API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign failed' },
      { status: 500 }
    );
  }
}
