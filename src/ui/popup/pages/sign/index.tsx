import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState
} from "react";
import { Button } from "../../../components/button";
import { RouteComponentProps } from "react-router";

import { HeaderLayout } from "../../layouts";

import style from "./style.module.scss";

import queryString from "query-string";
import { useStore } from "../../stores";
import { useSignature } from "../../../hooks";

import classnames from "classnames";
import { DataTab } from "./data-tab";
import { DetailsTab } from "./details-tab";
import { useIntl } from "react-intl";

enum Tab {
  Details,
  Data
}

export const SignPage: FunctionComponent<RouteComponentProps<{
  index: string;
}>> = ({ history, match, location }) => {
  const query = queryString.parse(location.search);
  const external = query.external ?? false;

  const index = match.params.index;

  const [tab, setTab] = useState<Tab>(Tab.Details);

  const intl = useIntl();

  const { chainStore } = useStore();

  const signing = useSignature(
    index,
    useCallback(
      chainId => {
        chainStore.setChain(chainId);
      },
      [chainStore]
    )
  );

  useEffect(() => {
    // Force reject when closing window.
    const beforeunload = async () => {
      if (!signing.loading && external && signing.reject) {
        await signing.reject();
      }
    };

    addEventListener("beforeunload", beforeunload);
    return () => {
      removeEventListener("beforeunload", beforeunload);
    };
  }, [signing, external]);

  useEffect(() => {
    return () => {
      // If index is changed, just reject the prior one.
      if (external && signing.reject) {
        signing.reject();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signing.reject, signing.index, external]);

  const onApproveClick = useCallback(async () => {
    if (signing.approve) {
      await signing.approve();
    }

    // If this is called by injected wallet provider. Just close.
    if (external) {
      window.close();
    }
  }, [signing, external]);

  const onRejectClick = useCallback(async () => {
    if (signing.reject) {
      await signing.reject();
    }

    // If this is called by injected wallet provider. Just close.
    if (external) {
      window.close();
    }
  }, [signing, external]);

  return (
    <HeaderLayout
      showChainName
      canChangeChainInfo={false}
      onBackButton={
        !external
          ? () => {
              history.goBack();
            }
          : undefined
      }
      style={{ background: "white" }}
    >
      <div className={style.container}>
        <div className="tabs is-fullwidth" style={{ marginBottom: 0 }}>
          <ul>
            <li className={classnames({ "is-active": tab === Tab.Details })}>
              <a
                onClick={() => {
                  setTab(Tab.Details);
                }}
              >
                {intl.formatMessage({
                  id: "sign.tab.details"
                })}
              </a>
            </li>
            <li className={classnames({ "is-active": tab === Tab.Data })}>
              <a
                onClick={() => {
                  setTab(Tab.Data);
                }}
              >
                {intl.formatMessage({
                  id: "sign.tab.data"
                })}
              </a>
            </li>
          </ul>
        </div>
        <div className={style.tabContainer}>
          {tab === Tab.Data ? <DataTab message={signing.message} /> : null}
          {tab === Tab.Details ? (
            <DetailsTab message={signing.message} />
          ) : null}
        </div>
        <div style={{ flex: 1 }} />
        <div className={style.buttons}>
          <Button
            className={style.button}
            size="medium"
            color="primary"
            disabled={
              signing.message == null ||
              signing.message === "" ||
              signing.initializing
            }
            loading={signing.requested}
            onClick={onApproveClick}
          >
            {intl.formatMessage({
              id: "sign.button.approve"
            })}
          </Button>
          <Button
            className={style.button}
            size="medium"
            color="danger"
            disabled={
              signing.message == null ||
              signing.message === "" ||
              signing.initializing
            }
            loading={signing.requested}
            onClick={onRejectClick}
          >
            {intl.formatMessage({
              id: "sign.button.reject"
            })}
          </Button>
        </div>
      </div>
    </HeaderLayout>
  );
};
