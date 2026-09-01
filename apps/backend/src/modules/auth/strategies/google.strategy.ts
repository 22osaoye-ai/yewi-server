import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth2';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ) {
    const { name, displayName, email, emails, picture, photos } = profile;
    const resolvedEmail = email || emails?.[0]?.value;
    const resolvedName =
      displayName ||
      (name?.givenName && name?.familyName
        ? `${name.givenName} ${name.familyName}`
        : name?.givenName || name || '');
    const resolvedPicture = picture || photos?.[0]?.value;

    const user = {
      email: resolvedEmail,
      name: resolvedName,
      picture: resolvedPicture,
      accessToken,
      refreshToken,
    };

    done(null, user);
    return user;
  }
}
