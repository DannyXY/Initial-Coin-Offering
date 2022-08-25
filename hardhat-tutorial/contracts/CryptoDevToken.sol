// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    ICryptoDevs CryptoDevsNFT;

    uint256 public constant tokensPerNFT = 10 * 10**18;

    uint256 public constant tokenPrice = 0.001 ether;

    uint256 public constant maxTotalSupply = 10000 * 10**18;

    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("0xWagmi Token", "0xW") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 amount) public payable {
        uint256 _requiredAmount = amount * tokenPrice;
        require(
            msg.value >= _requiredAmount,
            "You are not sending enough ether"
        );
        uint256 amountWithoutDecimals = amount * 10**18;
        require(
            totalSupply() + amountWithoutDecimals <= maxTotalSupply,
            "Exceeds max total supply available"
        );
        _mint(msg.sender, amountWithoutDecimals);
    }

    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require(balance > 0, "You don't hold any 0xWagmi NFT's");
        uint256 amount = 0;
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        require(
            totalSupply() + amount <= maxTotalSupply,
            "Exceeds max total supply available"
        );
        require(amount > 0, "You have already claimed all your tokens");

        _mint(msg.sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    receive() external payable {}

    fallback() external payable {}
}
