// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

error ONLY_OWNER();
error INSUFFICIENT_BALANCE();
error WITHDRAW_ERROR();

contract SaveEther {
    mapping(address => uint256) private s_addressToAmountSavedEthers;

    function saveEther() public payable {
        uint256 _balance = s_addressToAmountSavedEthers[msg.sender];
        s_addressToAmountSavedEthers[msg.sender] = _balance + msg.value;
    }

    function retrieveContractEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function retrieveUserEtherBalance(
        address _user
    ) external view returns (uint256) {
        return s_addressToAmountSavedEthers[_user];
    }

    function withdrawEther(uint256 _amount) external {
        uint256 _balance = s_addressToAmountSavedEthers[msg.sender];
        if (_amount > _balance) revert INSUFFICIENT_BALANCE();
        s_addressToAmountSavedEthers[msg.sender] = _balance - _amount;
        (bool callSuccess, ) = payable(msg.sender).call{value: _amount}("");
        if (!callSuccess) revert WITHDRAW_ERROR();
    }

    receive() external payable {
        saveEther();
    }

    fallback() external payable {
        saveEther();
    }
}
