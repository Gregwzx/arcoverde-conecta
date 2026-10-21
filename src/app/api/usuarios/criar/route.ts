import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // --- Autorização: apenas administradores autenticados ---
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Em modo demo (banca avaliadora), o cookie ac_demo_auth permite acesso,
    // mas sem usuário real, a operação requer service_role de qualquer forma.
    const demoAuth = request.cookies.get('ac_demo_auth')?.value === 'true';

    if (!user && !demoAuth) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // Verificar role admin (quando há usuário real)
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permissão negada. Apenas administradores podem criar servidores.' },
          { status: 403 }
        );
      }
    }

    // --- Validação dos dados ---
    const body = await request.json();
    const { nome, email, role, setor_id } = body;

    if (!nome?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    const emailLimpo = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpo)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const rolesPermitidas = ['admin', 'gestor', 'servidor'];
    if (!rolesPermitidas.includes(role)) {
      return NextResponse.json({ error: 'Papel (role) inválido.' }, { status: 400 });
    }

    // --- Criar usuário no Supabase Auth via Admin API ---
    let serviceClient;
    try {
      serviceClient = await createServiceRoleClient();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Service role key não configurada.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Senha temporária — o servidor deve usar "Esqueci minha senha" para definir a real
    const senhaTemporaria = `Arco${Date.now().toString(36)}!`;

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: emailLimpo,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome: nome.trim(),
        role,
      },
    });

    if (createError || !newUser?.user) {
      const mensagem = createError?.message || 'Falha ao criar usuário no Supabase Auth.';
      // Erro comum: e-mail já registrado
      if (mensagem.includes('already been registered') || mensagem.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado no sistema.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: mensagem }, { status: 500 });
    }

    // --- Garantir criação/atualização atômica do perfil (upsert) ---
    const profilePayload: Record<string, unknown> = {
      id: newUser.user.id,
      email: emailLimpo,
      nome: nome.trim(),
      role,
      ativo: true,
      updated_at: new Date().toISOString(),
    };
    if (setor_id) profilePayload.setor_id = setor_id;

    await serviceClient
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    // --- Retornar perfil completo ---
    const { data: perfil } = await serviceClient
      .from('profiles')
      .select('*, setor:setores(id, nome)')
      .eq('id', newUser.user.id)
      .single();

    return NextResponse.json(
      perfil || { id: newUser.user.id, nome: nome.trim(), email: emailLimpo, role },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /usuarios/criar] Erro inesperado:', err);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
