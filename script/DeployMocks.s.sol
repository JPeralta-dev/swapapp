// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { MockERC20 } from "../src/mocktoken.sol";

contract DeployMocksScript is Script {
    function run() external returns (MockERC20 tokenA, MockERC20 tokenB) {
        // Clave privada por defecto de la Cuenta 0 de Anvil (o de variable de entorno PRIVATE_KEY)
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        address deployer = vm.addr(deployerPrivateKey);
        console.log("Desplegando contratos desde la cuenta:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Desplegar dos tokens para el par de intercambio
        tokenA = new MockERC20("Mock USD Coin", "USDC");
        tokenB = new MockERC20("Mock Dai", "DAI");

        // Mintear un saldo inicial para la cuenta deployer (10,000 unidades de cada uno)
        tokenA.mint(10_000 * 10 ** 18);
        tokenB.mint(10_000 * 10 ** 18);

        vm.stopBroadcast();

        console.log("Mock USDC desplegado en:", address(tokenA));
        console.log("Mock DAI desplegado en:", address(tokenB));
        console.log("Balance inicial minteado a la cuenta:", deployer);
    }
}
