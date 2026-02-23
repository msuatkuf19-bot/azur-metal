import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { masterId, masterName, jobId, tutar, aciklama } = body;

    if (!masterId || !jobId || !tutar) {
      return NextResponse.json(
        { success: false, error: 'Eksik bilgi' },
        { status: 400 }
      );
    }

    // Yeni ödeme kaydı oluştur
    const payment = await prisma.payment.create({
      data: {
        jobId,
        masterId,
        tip: 'Gider',
        taraf: 'Usta',
        tutar: parseFloat(tutar),
        tarih: new Date(),
        aciklama: aciklama || `${masterName} usta ödemesi`,
        odemeYontemi: 'Nakit',
      },
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Ödeme kayıt hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Ödeme kaydedilemedi' },
      { status: 500 }
    );
  }
}
