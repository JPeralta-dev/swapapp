// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

import { Swapapp } from "../src/swapapp.sol";
import { IERC20 } from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "forge-std/Test.sol";

contract swappTest is Test {
    Swapapp app;

    // Router V2 en Arbitrum One (SushiSwap V2 Router, estándar Uniswap V2)
    address router = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;

    // Tokens reales en Arbitrum One
    address usdc = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8; // Bridged USDC (USDC.e) - 6 decimales
    address weth = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1; // WETH - 18 decimales

    address user = makeAddr("alice");

    event SwapToken(address indexed fromUser, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    function setUp() public {
        app = new Swapapp(router);
    }

    function testHasBeenDeploymentCorrectly() public view {
        assert(app.V2Router02() == router);
    }

    function testSwapTokenCorrectly() public {
        uint256 amountIn = 1000 * 1e6; // 1,000 USDC (6 decimales)

        // 1. CHEATCODE vm.deal: Inicializa la cuenta de Alice localmente con 1 ETH
        // Esto evita que Foundry tenga que consultar al RPC por el estado de una cuenta nueva
        vm.deal(user, 1 ether);

        // 2. CHEATCODE deal: Asigna 1,000 USDC en el almacenamiento local del token
        deal(usdc, user, amountIn);
        assertEq(IERC20(usdc).balanceOf(user), amountIn, "El usuario debe tener 1,000 USDC");

        // 2. Construir la ruta de intercambio: USDC -> WETH
        address[] memory path = new address[](2);
        path[0] = usdc;
        path[1] = weth;

        uint256 deadline = block.timestamp + 300;

        // 3. CHEATCODE startPrank: Fingimos que todas las transacciones siguientes las firma 'user'
        vm.startPrank(user);

        // El usuario aprueba al contrato Swapapp a gastar sus 1,000 USDC
        IERC20(usdc).approve(address(app), amountIn);

        // Ejecutamos el swap real a traves de nuestro Swapapp
        app.swapToken(amountIn, 0, path, deadline);

        vm.stopPrank();

        // 4. VERIFICACIONES POST-SWAP
        // A. El balance de USDC del usuario debio quedar en 0
        assertEq(IERC20(usdc).balanceOf(user), 0, "El usuario debio gastar todo el USDC");

        // B. El usuario debio recibir WETH directamente en su wallet
        uint256 wethBalance = IERC20(weth).balanceOf(user);
        assertGt(wethBalance, 0, "El usuario debio recibir WETH");

        // C. El contrato Swapapp no debe retener fondos (no es una custodia)
        assertEq(IERC20(usdc).balanceOf(address(app)), 0, "Swapapp no debe retener USDC");
        assertEq(IERC20(weth).balanceOf(address(app)), 0, "Swapapp no debe retener WETH");
    }
}