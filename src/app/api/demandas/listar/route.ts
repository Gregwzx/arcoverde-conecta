import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServiceRoleClient();
    const { data, error, count } = await supabase
      .from('demandas')
      .select('*, setor:setores(id, nome), responsavel:profiles(id, nome)', { count: 'exact' })
      .order('prioridade_pontuacao', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ demandas: data || [], total: count ?? (data?.length || 0) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}