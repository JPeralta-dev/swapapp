# SwapApp Indexer & Backend

Worker backend de alto rendimiento para escuchar, decodificar y almacenar eventos `SwapToken` emitidos por el smart contract `Swapapp.sol`.

## Tecnologías Utilizadas

- **TypeScript** + **Node.js**: Tipado estricto y ejecución moderna con ESM.
- **Viem**: Cliente Web3 de última generación (más rápido, ligero y tipado que Ethers).
- **PostgreSQL**: Base de datos relacional para analítica, histórico y consultas instantáneas.
- **Drizzle ORM**: Consultas SQL de alto rendimiento con TypeScript nativo.

## Arquitectura de Resiliencia

1. **Idempotencia Absoluta**: Índice único compuesto `(tx_hash, log_index)`. Si el proceso se reinicia o reintenta un bloque, jamás se duplican registros.
2. **Checkpointer Transaccional**: El avance de bloques (`last_indexed_block`) se actualiza dentro de la misma transacción en la que se guardan los swaps. Si la base de datos falla a mitad de camino, se hace rollback y no se pierden bloques.
3. **Manejo de Reorgs**: Tabla `blocks` con registro de `block_hash` y `parent_hash` para validar la cadena de bloques.
4. **Graceful Shutdown**: Cierre controlado de conexiones a PostgreSQL y detención de sondeo al recibir `SIGINT` o `SIGTERM`.

## Configuración y Puesta en Marcha

### 1. Instalar dependencias
Desde la carpeta `backend/`:
```bash
npm install
```

### 2. Configurar variables de entorno
Crea tu archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
```
Y define:
- `DATABASE_URL`: La URL de tu PostgreSQL en la nube (Supabase, Neon, etc.).
- `RPC_URL`: El nodo RPC (ej. `http://127.0.0.1:8545` para Anvil o `https://arb1.arbitrum.io/rpc`).
- `SWAPAPP_CONTRACT_ADDRESS`: La dirección de tu contrato `Swapapp` desplegado.

### 3. Crear las tablas en la Base de Datos
Aplica el esquema directamente en tu PostgreSQL en la nube con Drizzle:
```bash
npm run db:push
```

*(Opcional) Para abrir una interfaz gráfica web de tu base de datos:*
```bash
npm run db:studio
```

### 4. Iniciar el Worker Indexador
En modo desarrollo con recarga automática:
```bash
npm run dev
```
