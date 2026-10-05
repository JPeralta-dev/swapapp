// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { Swapapp } from "../src/swapapp.sol";

contract DeploySwapappScript is Script {
    // Router V2 por defecto (SushiSwap V2 en Arbitrum One)
    address constant DEFAULT_ROUTER = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;

    function run() external returns (Swapapp swapapp) {
        // Clave privada de despliegue (por defecto la cuenta 0 de Anvil)
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        // Permitir sobreescribir el router via variable de entorno si se despliega en otra red
        address routerAddress = vm.envOr("ROUTER_ADDRESS", DEFAULT_ROUTER);

        address deployer = vm.addr(deployerPrivateKey);
        console.log("--------------------------------------------------");
        console.log("Desplegando Swapapp...");
        console.log("Deployer:", deployer);
        console.log("Router V2 configurado:", routerAddress);

        vm.startBroadcast(deployerPrivateKey);

        swapapp = new Swapapp(routerAddress);

        vm.stopBroadcast();

        console.log("Swapapp desplegado exitosamente en:", address(swapapp));
        console.log("--------------------------------------------------");
    }
}
