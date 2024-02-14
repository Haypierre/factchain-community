//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {FactchainSFT} from "./FactchainSFT.sol";

contract FactchainSFTProxy is ERC1967Proxy {
    FactchainSFT collection = new FactchainSFT();

    constructor(address _owner)
        ERC1967Proxy(address(collection), abi.encodeCall(collection.initialize, (_owner)))
    {}
}