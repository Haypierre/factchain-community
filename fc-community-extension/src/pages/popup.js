import { render } from 'solid-js/web';
import { createSignal, Switch, Match, createResource } from 'solid-js';
import {
  createFactchainProvider,
  checkIfMetamaskInstalled,
} from '../utils/web3';
import { FCHero, FCLoader, FCContainer, FCHeader } from './components';
import FCNote from './components/FCNote';
import FCEmptyState from './components/FCEmptyState';
import {
  FCMetamaskConnectButton,
  FCRabbyConnectButton,
} from './components/FCConnectButton';
import { getNotesForAllSocials } from '../utils/backend';
import { ethers } from 'ethers';
import { elipseText } from '../utils/constants';

import './style.css';

const FCNetworks = () => {
  return (
    <div className="grid grid-cols-[80px_80px_80px] gap-4 justify-center">
      <a href="https://x.com/factchaintech" target="_blank">
        <img title="X" className="w-[80px] h-[80px]" src="/logos/x.png" />
      </a>
      <a href="https://warpcast.com/factchain/0x791ff20e" target="_blank">
        <img
          title="Warpcast"
          className="w-[80px] h-[80px]"
          src="/logos/warpcast.png"
        />
      </a>
      <img
        title="Youtube"
        className="w-[80px] h-[80px]"
        src="/logos/youtube.png"
      />
      <div className="-mt-2 col-span-2 col-start-2 text-fcAccent text-right text-sm">
        {'Up Next!'}
      </div>
    </div>
  );
};

function FCProfile(props) {
  function StatCard(props) {
    return (
      <div className="text-center">
        <div className="font-bold text-xl">{props.value}</div>
        <div className="text-md opacity-50">{props.name}</div>
      </div>
    );
  }

  return (
    <FCContainer>
      <div className="space-y-4 min-h-full flex flex-col">
        <div className="flex-grow space-y-4">
          <div className="flex items-center w-5/6 mx-auto bg-neutral-950/30 py-2 px-4 rounded gap-4 shadow-md border border-neutral-950/40">
            <img
              src="/logos/eth.png"
              alt="Profile Picture"
              className="rounded-full w-[40px] h-[40px] object-cover shadow"
            />
            <div className="flex-grow">
              <div className="font-semibold text-xl">Account</div>
              <div className="opacity-70">
                {props.loggedIn ? props.networkName : 'Unknown network'}
              </div>
              <div className="opacity-70">
                {props.loggedIn ? elipseText(props.address, 20) : '0x?'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl px-10 py-6">
            <StatCard name="Notes" value={props.numberNotes} />
            <StatCard name="Ratings" value={props.numberRatings} />
            <StatCard
              name="Earnings"
              value={`${props.earnings.slice(0, 7)} ⧫`}
            />
          </div>
          {props.loggedIn && <FCNetworks />}
        </div>
        <Switch>
          <Match when={props.loggedIn}>
            <button
              className="w-full p-4 font-semibold text-base btn"
              onclick={props.changeConnectionState}
            >
              Log out
            </button>
          </Match>
          <Match when={!props.loggedIn}>
            <FCMetamaskConnectButton
              isInstalled={props.isMetamaskInstalled}
              connectWallet={props.changeConnectionState}
            />
            <FCRabbyConnectButton connectWallet={() => {}} />
          </Match>
        </Switch>
      </div>
    </FCContainer>
  );
}

function FCNotes(props) {
  const [notes] = createResource(props.loggedIn, (loggedIn) => {
    if (loggedIn) {
      return getNotesForAllSocials(props.queryparams);
    } else {
      return null;
    }
  });

  return (
    <FCContainer>
      <Switch>
        <Match when={!props.loggedIn}>
          <div className="h-full flex flex-col justify-center items-center">
            <div className="link text-lg" onclick={props.connectWallet}>
              Connect a wallet
            </div>
            <div>to view Factchain notes</div>
          </div>
        </Match>
        <Match when={notes()}>
          <Switch>
            <Match when={notes().length > 0}>
              <div class="space-y-4">
                <For each={notes()}>
                  {(note) => (
                    <FCNote
                      key={note.postUrl}
                      postUrl={note.postUrl}
                      creator={note.creatorAddress}
                      content={note.content}
                      finalRating={note.finalRating}
                    />
                  )}
                </For>
              </div>
            </Match>
            <Match when={notes().length === 0}>
              <FCEmptyState text={props.emptyText} />
            </Match>
          </Switch>
        </Match>
        <Match when={true}>
          <div
            style={{
              position: 'relative',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FCLoader />
          </div>
        </Match>
      </Switch>
    </FCContainer>
  );
}

function FCFooter(props) {
  function FCFooterTab(props) {
    const selected = () => props.name === props.selectedTab;
    const classes = () => `tab ${selected() ? 'selected' : ''}`;
    const imgSrc = `./${props.name.toLowerCase()}.svg`;
    return (
      <button
        class={classes()}
        onclick={() => props.onClick(props.name)}
        title={props.name}
      >
        <img className="w-[18px] h-[18px]" src={imgSrc} alt={props.name}></img>
      </button>
    );
  }
  return (
    <div className="flex items-center justify-between bg-fcGrey py-2 px-6">
      <FCFooterTab
        name="Profile"
        selectedTab={props.selectedTab}
        onClick={props.setSelectedTab}
      />
      <FCFooterTab
        name="Notes"
        selectedTab={props.selectedTab}
        onClick={props.setSelectedTab}
      />
      <FCFooterTab
        name="Ratings"
        selectedTab={props.selectedTab}
        onClick={props.setSelectedTab}
      />
    </div>
  );
}

function FCPopup() {
  const [selectedTab, setSelectedTab] = createSignal('Profile');
  const [address, setAddress] = createSignal('');
  const loggedIn = () => !!address();

  const [isMetamaskInstalled] = createResource(checkIfMetamaskInstalled);
  const [provider] = createResource(
    isMetamaskInstalled,
    async (isMetamaskInstalled) => {
      console.log(
        `getting provider isMetamaskInstalled: ${isMetamaskInstalled}`
      );
      if (isMetamaskInstalled) {
        const p = await createFactchainProvider();
        p.getAddress().then(setAddress);
        return p;
      } else {
        return null;
      }
    }
  );

  const changeConnectionState = async () => {
    if (!provider()) {
      return;
    }
    setSelectedTab('Profile');
    if (loggedIn()) {
      await provider().disconnect();
      await chrome.runtime.sendMessage({
        type: 'fc-set-address',
        address: '',
      });
      setAddress('');
    } else {
      await provider().requestAddress().then(setAddress);
    }
  };

  const [userStats] = createResource(address, async (address) => {
    console.log(`address: ${address}`);
    if (address) {
      const contract = await provider().getMainContract();
      const stats = await contract.userStats(address);
      console.log(`User stats: ${stats}`);
      const earnings = `${Math.max(Number(stats[2] - stats[3]), 0)}`;
      return {
        notes: `${stats[0]}`,
        ratings: `${stats[1]}`,
        earnings: `${ethers.formatEther(earnings)}`,
      };
    } else {
      console.log(`Default data for user stats`);
      return {
        notes: '?',
        ratings: '?',
        earnings: '?',
      };
    }
  });
  const numberNotes = () =>
    userStats.ready || !userStats() ? '?' : userStats().notes;
  const numberRatings = () =>
    userStats.loading || !userStats() ? '?' : userStats().ratings;
  const earnings = () =>
    userStats.loading || !userStats() ? '?' : userStats().earnings;
  const networkName = () =>
    provider() ? provider().selectedNetwork.displayName : '?';

  return (
    <div className="h-[600px] w-[375px] flex flex-col">
      <Switch>
        <Match when={selectedTab() === 'Profile'}>
          <FCHero />
          <FCProfile
            isMetamaskInstalled={isMetamaskInstalled()}
            loggedIn={loggedIn()}
            address={address()}
            changeConnectionState={changeConnectionState}
            numberNotes={numberNotes()}
            numberRatings={numberRatings()}
            earnings={earnings()}
            networkName={networkName()}
          />
        </Match>
        <Match when={selectedTab() === 'Notes'}>
          <FCHeader title="My notes" />
          <FCNotes
            loggedIn={loggedIn()}
            queryparams={{ creatorAddress: address() }}
            connectWallet={changeConnectionState}
            emptyText="You don't have any notes yet."
          />
        </Match>
        <Match when={selectedTab() === 'Ratings'}>
          <FCHeader title="Ratings" />
          <FCNotes
            loggedIn={loggedIn()}
            queryparams={{ awaitingRatingBy: address() }}
            connectWallet={changeConnectionState}
            emptyText="No ratings to do yet."
          />
        </Match>
      </Switch>
      <FCFooter selectedTab={selectedTab()} setSelectedTab={setSelectedTab} />
    </div>
  );
}

render(() => <FCPopup />, document.getElementById('app'));
