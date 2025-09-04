#!/bin/bash

# Script de auto-recuperação para o servidor na porta 5508

# Função para log de erro
log_error() {
    echo "[ERRO] $(date '+%Y-%m-%d %H:%M:%S'): $1" >&2
}

# Função para log de informação
log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S'): $1"
}

# Verificar se o servidor está respondendo
check_server_response() {
    if nc -z localhost 5508; then
        log_info "Servidor respondendo na porta 5508"
        return 0
    else
        log_error "Servidor não está respondendo na porta 5508"
        return 1
    fi
}

# Verificar erros de módulos webpack no log
check_webpack_errors() {
    local log_file="npm-debug.log"
    
    if [ -f "$log_file" ]; then
        if grep -q "webpack" "$log_file"; then
            log_error "Erros de módulos webpack detectados no log"
            return 1
        fi
    fi
    
    log_info "Nenhum erro de webpack detectado"
    return 0
}

# Função principal de recuperação
recover_server() {
    # Parar o servidor
    log_info "Parando o servidor atual"
    if pgrep -f "npm run dev" > /dev/null; then
        pkill -f "npm run dev"
        sleep 5
    fi

    # Remover pasta .next
    if [ -d ".next" ]; then
        log_info "Removendo pasta .next"
        rm -rf .next
    fi

    # Reinstalar dependências
    log_info "Reinstalando dependências"
    npm install

    # Reiniciar o servidor
    log_info "Reiniciando o servidor"
    npm run dev &
    
    # Aguardar inicialização
    sleep 10
    
    # Verificar se o servidor subiu corretamente
    if check_server_response; then
        log_info "Servidor recuperado com sucesso"
        return 0
    else
        log_error "Falha na recuperação do servidor"
        return 1
    fi
}

# Execução principal
main() {
    log_info "Iniciando verificação de recuperação do servidor"

    # Verificar resposta do servidor
    if ! check_server_response; then
        log_info "Tentando recuperar servidor"
        recover_server
        exit $?
    fi

    # Verificar erros de webpack
    if ! check_webpack_errors; then
        log_info "Problemas de webpack detectados. Iniciando recuperação"
        recover_server
        exit $?
    fi

    log_info "Nenhum problema detectado. Servidor está funcionando corretamente"
    exit 0
}

# Executar script principal
main