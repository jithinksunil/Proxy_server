//@ts-nocheck
import { All, Controller, HttpStatus, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  @All('*')
  async mockAll(@Req() req: Request, @Res() res: Response) {
    const mockEndpoint = this.configService.get('MOCK_BASE_URL');
    const url = `${mockEndpoint}${req.originalUrl}`;

    try {
      const forwarded = await firstValueFrom(
        this.httpService.request({
          url,
          method: req.method as any,
          headers: {
            ...req.headers,
            host: undefined,
          } as any,
          data: req.body,
          validateStatus: () => true, // prevent axios from throwing on non-2xx
        }),
      );

      // ✅ Set cookies back on response
      const setCookie = forwarded.headers['set-cookie'];
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }

      // Forward other headers if needed
      // res.set(forwarded.headers); // optional

      return res.status(forwarded.status).send(forwarded.data);
    } catch (err) {
      console.error('Mock proxy error:', err?.response?.data || err.message);
      return res
        .status(err?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          error: 'Failed to forward request',
          detail: err?.response?.data || err.message,
        });
    }
  }
}
