// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TrueMintCommunity.sol";

contract TrueMintCommunityTest is Test, ITrueMintCommunity, IOwnable {
    TrueMintCommunity public tmCommunity;
    uint160 lastUintAddress = 0;

    function nextAddress() public returns (address) {
        lastUintAddress += 1;
        return address(lastUintAddress);
    }

    address public owner = nextAddress();
    address public notStaker = nextAddress();
    address public staker1 = nextAddress();
    address public staker2 = nextAddress();

    function stake(address staker, uint256 amount) public {
        vm.expectEmit();
        emit UserHasStaked(staker, amount);
        hoax(staker);
        (bool result,) = payable(tmCommunity).call{value: amount}("");
        assertTrue(result);
    }

    function fundReserve() public {
        vm.expectEmit();
        emit ReserveFunded(100);
        hoax(owner);
        (bool result,) = payable(tmCommunity).call{value: 100}("");
        assertTrue(result);
    }

    function setUp() public {
        tmCommunity = new TrueMintCommunity({_owner: owner});
        fundReserve();
        stake(staker1, 100);
        stake(staker2, 100);
    }

    function test_createNote_RevertIf_userNotStaker() public {
        vm.startPrank(notStaker);

        vm.expectRevert(ITrueMintCommunity.UserHasNoStake.selector);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });
    }

    function test_createNote_RevertIf_postUrlInvalid() public {
        vm.startPrank(staker1);

        vm.expectRevert(ITrueMintCommunity.PostUrlInvalid.selector);
        tmCommunity.createNote({
            _postUrl: "",
            _content: "Something something something"
        });

        vm.expectRevert(ITrueMintCommunity.PostUrlInvalid.selector);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something-something-something-something-something-something-something-something-something-something-something-something-something-something-something",
            _content: "Something something something"
        });
    }

    function test_createNote_RevertIf_contentInvalid() public {
        vm.startPrank(staker1);

        vm.expectRevert(ITrueMintCommunity.ContentInvalid.selector);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: ""
        });

        vm.expectRevert(ITrueMintCommunity.ContentInvalid.selector);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something something"
        });
    }

    function test_createNote() public {
        vm.expectEmit();
        emit NoteCreated("https://twitter.com/something", staker1);
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectEmit();
        emit NoteCreated("https://twitter.com/something", staker2);
        vm.prank(staker2);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });
    }

    function test_createNote_RevertIf_alreadyExists() public {
        vm.startPrank(staker1);

        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectRevert(ITrueMintCommunity.NoteAlreadyExists.selector);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });
    }

    function test_rateNote_RevertIf_userNotStaker() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.prank(notStaker);
        vm.expectRevert(ITrueMintCommunity.UserHasNoStake.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });
    }

    function test_rateNote_RevertIf_ratingInvalid() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.startPrank(staker2);
        vm.expectRevert(ITrueMintCommunity.RatingInvalid.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 0
        });
        vm.expectRevert(ITrueMintCommunity.RatingInvalid.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 6
        });
    }

    function test_rateNote_RevertIf_creatorIsRater() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.prank(staker1);
        vm.expectRevert(ITrueMintCommunity.CantRateOwnNote.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });
    }

    function test_rateNote_RevertIf_noteDoesNotExist() public {
        vm.prank(staker2);
        vm.expectRevert(ITrueMintCommunity.NoteDoesNotExist.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });
    }

    function test_rateNote_RevertIf_noteAlreadyFinalised() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });
        
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });

        vm.prank(staker2);
        vm.expectRevert(ITrueMintCommunity.NoteAlreadyFinalised.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 2
        });
    }

    function test_rateNote() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectEmit();
        emit NoteRated("https://twitter.com/something", staker1, staker2, 1);
        vm.prank(staker2);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });
    }

    function test_rateNote_RevertIf_ratingAlreadyExist() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.startPrank(staker2);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });

        vm.expectRevert(ITrueMintCommunity.RatingAlreadyExists.selector);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 2
        });
    }

    function test_finaliseNote_RevertIf_notOwner() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.prank(staker1);
        vm.expectRevert(IOwnable.NotOwner.selector);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });
    }

    function test_finaliseNote_RevertIf_ratingInvalid() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.startPrank(owner);
        vm.expectRevert(ITrueMintCommunity.RatingInvalid.selector);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 0
        });
        vm.expectRevert(ITrueMintCommunity.RatingInvalid.selector);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 6
        });
    }

    function test_finaliseNote_RevertIf_notDoesNotExist() public {
        vm.prank(owner);
        vm.expectRevert(ITrueMintCommunity.NoteDoesNotExist.selector);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });
    }

    function test_finaliseNote() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectEmit();
        emit NoteFinalised("https://twitter.com/something", staker1, 1);
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });
    }

    function test_finaliseNote_RevertIf_noteAlreadyFinalised() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.startPrank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });

        vm.expectRevert(ITrueMintCommunity.NoteAlreadyFinalised.selector);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });
    }

    function test_rewardAndSlashRaters() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.prank(staker2);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 1
        });

        address badHighStaker = nextAddress();
        stake(badHighStaker, 100);
        vm.prank(badHighStaker);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 5
        });

        // Low stake, bad rating
        address badLowStaker = nextAddress();
        stake(badLowStaker, 1);
        vm.prank(badLowStaker);
        tmCommunity.rateNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _rating: 5
        });

        vm.expectEmit();
        emit RaterRewarded("https://twitter.com/something", staker1, staker2, 2);
        vm.expectEmit();
        emit RaterSlashed("https://twitter.com/something", staker1, badHighStaker, 2);
        vm.expectEmit();
        emit RaterSlashed("https://twitter.com/something", staker1, badLowStaker, 1);
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 1
        });
    }

    function test_rewardCreator() public {
        vm.prank(staker1);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectEmit();
        emit CreatorRewarded("https://twitter.com/something", staker1, 30);
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: staker1,
            _finalRating: 5
        });
    }

    function test_slashCreator() public {
        address badHighStaker = nextAddress();
        stake(badHighStaker, 100);
        vm.prank(badHighStaker);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        address badLowStaker = nextAddress();
        stake(badLowStaker, 5);
        vm.prank(badLowStaker);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something",
            _content: "Something something something"
        });

        vm.expectEmit();
        emit CreatorSlashed("https://twitter.com/something", badHighStaker, 10);
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: badHighStaker,
            _finalRating: 1
        });

        vm.expectEmit();
        emit CreatorSlashed("https://twitter.com/something", badLowStaker, 5);
        vm.prank(owner);
        tmCommunity.finaliseNote({
            _postUrl: "https://twitter.com/something",
            _creator: badLowStaker,
            _finalRating: 1
        });

        vm.expectRevert(ITrueMintCommunity.UserHasNoStake.selector);
        vm.prank(badLowStaker);
        tmCommunity.createNote({
            _postUrl: "https://twitter.com/something-new",
            _content: "Something something something"
        });
    }

    // TODO test revert for insufficient reward
}
