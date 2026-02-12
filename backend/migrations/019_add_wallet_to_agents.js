/**
 * Migration: Add wallet fields to agents table
 * Adds blockchain wallet capabilities for autonomous agent transactions
 */

export function up(knex) {
    return knex.schema.table('agents', (table) => {
        table.string('wallet_address', 42).unique().comment('Blockchain wallet address');
        table.text('private_key_encrypted').comment('Encrypted private key for transactions');
        table.decimal('eth_balance', 18, 8).defaultTo(0).comment('ETH balance for gas fees');
        table.decimal('tyc_balance', 18, 8).defaultTo(0).comment('TYC token balance');
        table.decimal('usdc_balance', 18, 8).defaultTo(0).comment('USDC token balance');
        table.timestamp('last_balance_sync').comment('Last time balances were synced from chain');
        table.boolean('registered_onchain').defaultTo(false).comment('Whether agent is registered on Tycoon contract');
        table.timestamp('registered_onchain_at').comment('When agent was registered on-chain');
    });
}

export function down(knex) {
    return knex.schema.table('agents', (table) => {
        table.dropColumn('wallet_address');
        table.dropColumn('private_key_encrypted');
        table.dropColumn('eth_balance');
        table.dropColumn('tyc_balance');
        table.dropColumn('usdc_balance');
        table.dropColumn('last_balance_sync');
        table.dropColumn('registered_onchain');
        table.dropColumn('registered_onchain_at');
    });
}
