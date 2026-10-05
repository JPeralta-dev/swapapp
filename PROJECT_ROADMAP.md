# SwapApp & Blockchain Indexer: Arquitectura y Roadmap de Aprendizaje

> **Objetivo del Proyecto**: Construir un sistema Web3 completo, robusto y con arquitectura de producción para portafolio senior. No usamos cajas negras ni atajos: programamos paso a paso para dominar la ingeniería backend en blockchain.

---

## 1. Manifiesto y Principios de Trabajo
1. **Programación a mano y comprensión profunda**: Cada contrato, script, worker y endpoint se escribe entendiendo el porqué de cada línea, sus compensaciones (*trade-offs*) y consumo de recursos.
2. **Arquitectura desacoplada**: La blockchain es solo la capa de consenso y estado final. El backend en Node.js/TypeScript procesa, normaliza e indexa los eventos de forma asíncrona e independiente.
3. **Resiliencia ante fallos**: El backend debe soportar desconexiones de nodos RPC, forks/reorganizaciones de bloques (*reorgs*), y garantizar idempotencia (no duplicar registros al reiniciar).

---

## 2. Mapa de Arquitectura del Sistema

```
+-------------------------------------------------------------------+
|                        CAPA BLOCKCHAIN                            |
|  - Anvil (Local) / Red de Pruebas                                 |
|  - MockERC20 (USDC, DAI) con función faucet                       |
|  - Swapapp.sol (Orquestador de swaps con Uniswap V2 Router)       |
+---------------------------------+---------------------------------+
                                  | Emite eventos (SwapToken, Transfer)
                                  v
+-------------------------------------------------------------------+
|                    CAPA BACKEND (Node.js + TS)                    |
|                                                                   |
|   [ 1. Ingestor / Worker ]                                        |
|   - Conexión Dual: WebSocket (en vivo) + Poller (histórico)      |
|   - Reorg Handler (Safe vs Pending blocks)                        |
|   - Checkpointer (last_synced_block)                              |
|                                                                   |
|   [ 2. Base de Datos (PostgreSQL) ]                               |
|   - Tablas: blocks, swaps, token_transfers, sync_state            |
|                                                                   |
|   [ 3. API & WebSockets Server ]                                  |
|   - REST API: GET /swaps, GET /tokens/:address/stats              |
|   - WebSocket Gateway: Streaming de swaps en vivo al frontend     |
+---------------------------------+---------------------------------+
                                  | API REST & WebSocket
                                  v
+-------------------------------------------------------------------+
|                     CAPA FRONTEND (Next.js)                       |
|  - Conexión de Wallet (Wagmi / RainbowKit)                        |
|  - Interfaz de Swap estética con cotización en tiempo real        |
|  - Feed de transacciones en vivo alimentado por nuestro backend   |
+-------------------------------------------------------------------+
```

---

## 3. Fases de Desarrollo

- [x] **Fase 1A: Entorno y Cuentas**
  - Blockchain local levantada (`anvil`).
  - Cuenta de desarrollo importada en MetaMask (`0xf39F...92266`).
- [x] **Fase 1B: Mock Tokens y Faucet**
  - Contrato `mocktoken.sol` con función `mint()`.
  - Script de despliegue `DeployMocks.s.sol` ejecutado con éxito en Anvil.
- [x] **Fase 1C: Conexión de Red Local en MetaMask e Importación de Tokens**
  - Configuración de RPC `http://127.0.0.1:8545` y Chain ID `31337`.
  - Visualización de 10,000 ETH y saldos de USDC / DAI.
- [x] **Fase 2: El Contrato Swapapp y el Entorno de Liquidez**
  - Ajuste de eventos en `Swapapp.sol` (añadir `indexed` para búsquedas eficientes).
  - Configuración del Router/Factory V2 (SushiSwap V2 en Arbitrum One) para intercambios reales de tokens.
  - Tests en Foundry (`forge test` con fork y cheatcodes `deal`/`prank` completados con éxito).
  - Script de despliegue `DeploySwapapp.s.sol` configurado.
- [ ] **Fase 3: El Backend Indexador (TypeScript + Node.js + PostgreSQL)**
  - [x] Inicialización del proyecto backend (`package.json`, `tsconfig.json`).
  - [x] Esquema de base de datos en PostgreSQL con Drizzle ORM (`sync_state`, `blocks`, `swaps`).
  - [x] Creación del Worker Ingestor usando `viem` para escuchar bloques y decodificar eventos.
  - [x] Implementación de idempotencia (clave única compuesta txHash + logIndex) y Checkpointer transaccional.
  - [ ] Instalación de dependencias (`npm install`) y migración a DB (`npm run db:push`).
  - [ ] Servidor API REST y WebSockets en tiempo real.
- [ ] **Fase 4: Frontend y Experiencia Visual**
  - Aplicación Next.js / Tailwind.
  - Componente de Swap y panel de eventos en vivo.

---

## 4. Preguntas de Diseño que Resolveremos Juntos

1. **Estrategia de Liquidez**: Para hacer swaps reales entre USDC y DAI en local, ¿usaremos un fork local de Uniswap V2 de Ethereum mainnet con Anvil (`anvil --fork-url ...`), o desplegaremos una Factory/Router minimalista en nuestro propio Anvil? 
*Respuesta:* vamos hacer una fork local de Uniswap V2 de Ethereumn mainnet con anvil para menos complejidad y mas realimos
2. **Base de Datos y ORM**: ¿Prefieres usar PostgreSQL con SQL nativo/`pg`, o un ORM moderno y tipado como **Drizzle** o **Prisma**? 
*Respuesta:* Depende realmente necesito investigar pero creo que puede ser mas comodo utilizar Drizzle pero creo que puede ser beneficioso tener mayor manejo de cada sentencia.
3. **Servidor HTTP**: ¿Te gusta más **Fastify** (altísimo rendimiento) o **Express** (clásico y muy directo)?
*Respuesta:* Me siento mas comodo con express porque he trabajaod muchisimos con el pero creo que puede tener mayor utilidad dependiendo de donde queramos llevar el proyecto tener fastify
4. **Almacenamiento de Reorganizaciones**: ¿Cómo modelaremos los swaps que entran en un bloque que luego resulta huérfano (reorg)?
